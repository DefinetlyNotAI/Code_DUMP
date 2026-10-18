#include "uefi.h"
#include "font.h"

static EFI_GRAPHICS_OUTPUT_PROTOCOL *gop;
static EFI_SYSTEM_TABLE *system_table;
static volatile uint32_t *pixels;
static uint32_t width,height,stride,format;
static uint32_t color_bg=0x101827,color_panel=0x1f2e43,color_fg=0xe7f2fc,color_accent=0x39d9a2;
static uint32_t random_seed=0x9e3779b9;
static int scene=0,selected=0,alive=1,paused=0,won=0,score=0,best=0,dir=1,next_dir=1,snake_len=4,food_x,food_y;
static int difficulty=1,ticks=0;
#define CELLS_X 26
#define CELLS_Y 18
#define MAX_SNAKE (CELLS_X*CELLS_Y)
static int snake_x[MAX_SNAKE],snake_y[MAX_SNAKE];
static uint32_t draw_color(uint32_t rgb) {
 if(format==0) return ((rgb&255)<<16)|(rgb&0xff00)|((rgb>>16)&255);
 return rgb;
}
static void rect(int x,int y,int w,int h,uint32_t c){
 if(x<0){w+=x;x=0;}if(y<0){h+=y;y=0;}
 if(x>= (int)width||y>=(int)height||w<=0||h<=0)return;
 if(x+w>(int)width)w=(int)width-x;if(y+h>(int)height)h=(int)height-y;
 uint32_t v=draw_color(c);for(int j=0;j<h;j++)for(int i=0;i<w;i++)pixels[(y+j)*stride+x+i]=v;
}
static void chars(int x,int y,const char *s,int scale,uint32_t c){
 for(;*s;s++,x+=scale*6){unsigned char ch=(unsigned char)*s;
 if(ch>='a'&&ch<='z')ch-=32;
 if(ch<32||ch>127)ch='?';
 for(int i=0;i<5;i++)for(int j=0;j<7;j++)if(glyphs[ch-32][i]&(1<<j))rect(x+i*scale,y+j*scale,scale,scale,c);
 }
}
static int length(const char *s){int n=0;while(s[n])n++;return n;}
static void centered(int y,const char *s,int scale,uint32_t c){chars(((int)width-length(s)*scale*6)/2,y,s,scale,c);}
static void number(int x,int y,int n,int scale,uint32_t c){char out[16];int pos=15;out[pos--]=0;if(n==0)out[pos--]='0';while(n>0&&pos>=0){out[pos--]='0'+n%10;n/=10;}chars(x,y,&out[pos+1],scale,c);}
static uint32_t rng(void){random_seed^=random_seed<<13;random_seed^=random_seed>>17;random_seed^=random_seed<<5;return random_seed;}
static void add_food(void){
 int free_count=0;
 for(int y=0;y<CELLS_Y;y++)for(int x=0;x<CELLS_X;x++){
 int occupied=0;for(int i=0;i<snake_len;i++)if(snake_x[i]==x&&snake_y[i]==y){occupied=1;break;}
 if(!occupied)free_count++;
 }
 if(!free_count){alive=0;won=1;return;}
 int target=(int)(rng()%(uint32_t)free_count);
 for(int y=0;y<CELLS_Y;y++)for(int x=0;x<CELLS_X;x++){
 int occupied=0;for(int i=0;i<snake_len;i++)if(snake_x[i]==x&&snake_y[i]==y){occupied=1;break;}
 if(!occupied&&target--==0){food_x=x;food_y=y;return;}
 }
}
static void start_snake(void){score=0;dir=1;next_dir=1;alive=1;paused=0;won=0;ticks=0;snake_len=4;
 for(int i=0;i<snake_len;i++){snake_x[i]=CELLS_X/2-i;snake_y[i]=CELLS_Y/2;}add_food();scene=1;
}
static void snake_tick(void){
 if(!alive)return;
 dir=next_dir;int x=snake_x[0]+(dir==1)-(dir==3),y=snake_y[0]+(dir==2)-(dir==0);
 if(x<0||x>=CELLS_X||y<0||y>=CELLS_Y){alive=0;return;}
 int eating=(x==food_x&&y==food_y);
 for(int i=0;i<snake_len-(eating?0:1);i++)if(snake_x[i]==x&&snake_y[i]==y){alive=0;return;}
 if(eating&&snake_len<MAX_SNAKE){snake_len++;score+=10;if(score>best)best=score;}
 for(int i=snake_len-1;i>0;i--){snake_x[i]=snake_x[i-1];snake_y[i]=snake_y[i-1];}
 snake_x[0]=x;snake_y[0]=y;
 if(eating)add_food();
}
static void menu(void){
 rect(0,0,width,height,color_bg);
 centered((int)height/5,"TINY SNAKE OS",4,color_accent);
 centered((int)height/5+55,"NATIVE UEFI SNAKE",2,color_fg);
 centered((int)height/5+95,"RUNS WITHOUT WINDOWS OR LINUX",2,0x9dacc0);
 int bx=(int)width/2-155,by=(int)height/2-24;
 rect(bx,by,310,60,selected==0?color_accent:color_panel);
 centered(by+19,"[ PLAY SNAKE ]",2,selected==0?color_bg:color_fg);
 rect(bx,by+80,310,60,selected==1?color_accent:color_panel);
 centered(by+99,"[ SHUTDOWN ]",2,selected==1?color_bg:color_fg);
 centered((int)height-110,difficulty==0?"SPEED: EASY  [LEFT / RIGHT TO CHANGE]":difficulty==1?"SPEED: NORMAL  [LEFT / RIGHT TO CHANGE]":"SPEED: FAST  [LEFT / RIGHT TO CHANGE]",2,0x9dacc0);
 centered((int)height-70,"UP / DOWN: SELECT    ENTER: CONFIRM",2,0x9dacc0);
}
static void game(void){
 rect(0,0,width,height,color_bg);
 centered(18,"SNAKE",3,color_accent);
 int cell=(int)(width-80)/CELLS_X;
 int height_cell=(int)(height-125)/CELLS_Y;
 if(height_cell<cell)cell=height_cell;if(cell<4)cell=4;
 int ox=((int)width-CELLS_X*cell)/2,oy=75;
 rect(ox-4,oy-4,CELLS_X*cell+8,CELLS_Y*cell+8,0x577389);
 rect(ox,oy,CELLS_X*cell,CELLS_Y*cell,0x152538);
 rect(ox+food_x*cell+2,oy+food_y*cell+2,cell-4,cell-4,0xff697d);
 for(int i=snake_len-1;i>=0;i--)rect(ox+snake_x[i]*cell+1,oy+snake_y[i]*cell+1,cell-2,cell-2,i==0?0xe7f2fc:color_accent);
 chars(ox,oy+CELLS_Y*cell+20,"SCORE",2,color_fg);number(ox+80,oy+CELLS_Y*cell+20,score,2,color_accent);
 chars(ox+CELLS_X*cell-204,oy+CELLS_Y*cell+20,"BEST",2,color_fg);number(ox+CELLS_X*cell-124,oy+CELLS_Y*cell+20,best,2,color_accent);
 centered((int)height-33,"WASD / ARROWS: MOVE    P: PAUSE    R: RESTART    ESC: MENU",1,0x9dacc0);
 if(paused&&alive){int ry=oy+(CELLS_Y*cell)/2-45;rect(ox+20,ry,CELLS_X*cell-40,104,color_panel);centered(ry+17,"PAUSED",3,color_accent);centered(ry+70,"P TO RESUME",2,color_fg);}
 if(!alive){
 int ry=oy+(CELLS_Y*cell)/2-68;
 rect(ox+20,ry,CELLS_X*cell-40,145,color_panel);
 centered(ry+18,won?"YOU WIN":"GAME OVER",3,won?color_accent:0xff697d);
 centered(ry+72,"ENTER TO RESTART",2,color_fg);
 centered(ry+103,"ESC TO MENU",2,color_fg);
 }
}
static void draw(void){if(scene==0)menu();else game();}
static void pressed(EFI_INPUT_KEY k){
 int up=(k.ScanCode==1||k.UnicodeChar=='w'||k.UnicodeChar=='W');
 int down=(k.ScanCode==2||k.UnicodeChar=='s'||k.UnicodeChar=='S');
 int right=(k.ScanCode==3||k.UnicodeChar=='d'||k.UnicodeChar=='D');
 int left=(k.ScanCode==4||k.UnicodeChar=='a'||k.UnicodeChar=='A');
 int enter=(k.UnicodeChar==13),esc=(k.ScanCode==23||k.UnicodeChar==27);
 if(scene==0){if(up||down)selected=!selected;
 if(left&&difficulty>0)difficulty--;if(right&&difficulty<2)difficulty++;
 if(enter){if(selected==0)start_snake();else system_table->RuntimeServices->ResetSystem(EFI_RESET_SHUTDOWN,EFI_SUCCESS,0,0);}return;}
 if(esc){scene=0;return;}
 if(k.UnicodeChar=='r'||k.UnicodeChar=='R'){start_snake();return;}
 if(!alive){if(enter)start_snake();return;}
 if(k.UnicodeChar=='p'||k.UnicodeChar=='P'){paused=!paused;return;}
 if(paused)return;
 if(up&&dir!=2)next_dir=0;
 else if(right&&dir!=3)next_dir=1;
 else if(down&&dir!=0)next_dir=2;
 else if(left&&dir!=1)next_dir=3;
}
EFI_STATUS EFIAPI efi_main(EFI_HANDLE image,EFI_SYSTEM_TABLE *st){
 (void)image;system_table=st;
 if(!st||!st->BootServices||!st->RuntimeServices||!st->ConIn)return 1;
 // A firmware watchdog can otherwise reset long-running interactive applications.
 if(st->BootServices->SetWatchdogTimer)st->BootServices->SetWatchdogTimer(0,0,0,0);
 EFI_STATUS status=st->BootServices->LocateProtocol((EFI_GUID*)&EFI_GRAPHICS_OUTPUT_PROTOCOL_GUID,0,(void**)&gop);
 if(EFI_ERROR(status)||!gop||!gop->Mode||!gop->Mode->Info)return status?status:1;
 EFI_GRAPHICS_OUTPUT_MODE_INFORMATION *info=gop->Mode->Info;
 width=info->HorizontalResolution;height=info->VerticalResolution;stride=info->PixelsPerScanLine;format=info->PixelFormat;
 // GOP pixel formats 0=RGB reserved, 1=BGR reserved. No BitMask or BltOnly support.
 if((format!=0&&format!=1)||width<640||height<480||!gop->Mode->FrameBufferBase)return 2;
 pixels=(volatile uint32_t*)(uintptr_t)gop->Mode->FrameBufferBase;
 random_seed^=(uint32_t)gop->Mode->FrameBufferBase;
 void *timer=0;
 status=st->BootServices->CreateEvent(EFI_EVENT_TIMER,0,0,0,&timer);
 if(EFI_ERROR(status))return status;
 // 100ms timer. UEFI unit is 100ns.
 status=st->BootServices->SetTimer(timer,EFI_TIMER_PERIODIC,1000000);
 if(EFI_ERROR(status)){st->BootServices->CloseEvent(timer);return status;}
 st->ConIn->Reset(st->ConIn,0);
 void *events[2]={st->ConIn->WaitForKey,timer};
 draw();
 for(;;){
 UINTN index=0;
 status=st->BootServices->WaitForEvent(2,events,&index);
 if(EFI_ERROR(status))break;
 if(index==0){EFI_INPUT_KEY key;while(st->ConIn->ReadKeyStroke(st->ConIn,&key)==EFI_SUCCESS)pressed(key);}
 else if(scene==1&&alive&&!paused){if(++ticks >= (difficulty==0?3:difficulty==1?2:1)){ticks=0;snake_tick();}}
 draw();
 }
 st->BootServices->CloseEvent(timer);
 return status;
}
