#ifndef TINY_UEFI_H
#define TINY_UEFI_H
#include <stdint.h>
#include <stddef.h>
typedef uint64_t EFI_STATUS;
typedef void *EFI_HANDLE;
typedef uint64_t UINTN;
typedef uint16_t CHAR16;
typedef uint64_t EFI_PHYSICAL_ADDRESS;
#define EFIAPI __attribute__((ms_abi))
#define EFI_SUCCESS 0
#define EFI_ERROR(s) (((s)>>63)!=0)
#define EFI_NOT_READY (0x8000000000000006ULL)
#define EFI_BUFFER_TOO_SMALL (0x8000000000000005ULL)
#define EFI_NATIVE_INTERFACE 0
#define EFI_EVENT_TIMER 0x80000000U
#define EFI_TIMER_PERIODIC 1
#define EFI_RESET_SHUTDOWN 2
#define EFI_RESET_COLD 0
typedef struct {uint32_t a;uint16_t b,c;uint8_t d[8];} EFI_GUID;
typedef struct {uint16_t ScanCode;CHAR16 UnicodeChar;} EFI_INPUT_KEY;
typedef struct EFI_SIMPLE_TEXT_INPUT_PROTOCOL EFI_SIMPLE_TEXT_INPUT_PROTOCOL;
struct EFI_SIMPLE_TEXT_INPUT_PROTOCOL {
 EFI_STATUS(EFIAPI *Reset)(EFI_SIMPLE_TEXT_INPUT_PROTOCOL*,uint8_t);
 EFI_STATUS(EFIAPI *ReadKeyStroke)(EFI_SIMPLE_TEXT_INPUT_PROTOCOL*, EFI_INPUT_KEY*);
 void *WaitForKey;
};
typedef struct {
 uint32_t Version;uint32_t HorizontalResolution;uint32_t VerticalResolution;
 uint32_t PixelFormat;struct {uint32_t RedMask,GreenMask,BlueMask,ReservedMask;} PixelInformation;
 uint32_t PixelsPerScanLine;
} EFI_GRAPHICS_OUTPUT_MODE_INFORMATION;
typedef struct {uint32_t MaxMode, Mode;EFI_GRAPHICS_OUTPUT_MODE_INFORMATION *Info;UINTN SizeOfInfo; EFI_PHYSICAL_ADDRESS FrameBufferBase;UINTN FrameBufferSize;} EFI_GRAPHICS_OUTPUT_PROTOCOL_MODE;
typedef struct EFI_GRAPHICS_OUTPUT_PROTOCOL EFI_GRAPHICS_OUTPUT_PROTOCOL;
struct EFI_GRAPHICS_OUTPUT_PROTOCOL {
 EFI_STATUS(EFIAPI *QueryMode)(EFI_GRAPHICS_OUTPUT_PROTOCOL*,uint32_t,UINTN*,EFI_GRAPHICS_OUTPUT_MODE_INFORMATION**);
 EFI_STATUS(EFIAPI *SetMode)(EFI_GRAPHICS_OUTPUT_PROTOCOL*,uint32_t);
 EFI_STATUS(EFIAPI *Blt)(EFI_GRAPHICS_OUTPUT_PROTOCOL*,void*,uint32_t,UINTN,UINTN,UINTN,UINTN,UINTN,UINTN,UINTN);
 EFI_GRAPHICS_OUTPUT_PROTOCOL_MODE *Mode;
};
typedef struct EFI_BOOT_SERVICES EFI_BOOT_SERVICES;
struct EFI_BOOT_SERVICES {
 char header[24];
 void *RaiseTPL,*RestoreTPL;
 void *AllocatePages,*FreePages,*GetMemoryMap,*AllocatePool,*FreePool;
 EFI_STATUS(EFIAPI *CreateEvent)(uint32_t,UINTN,void*,void*,void**);
 EFI_STATUS(EFIAPI *SetTimer)(void*,uint32_t,uint64_t);
 EFI_STATUS(EFIAPI *WaitForEvent)(UINTN,void**,UINTN*);
 EFI_STATUS(EFIAPI *SignalEvent)(void*);
 EFI_STATUS(EFIAPI *CloseEvent)(void*);
 EFI_STATUS(EFIAPI *CheckEvent)(void*);
 void *InstallProtocolInterface,*ReinstallProtocolInterface,*UninstallProtocolInterface,*HandleProtocol;
 void *Reserved;
 void *RegisterProtocolNotify,*LocateHandle,*LocateDevicePath,*InstallConfigurationTable;
 void *LoadImage,*StartImage,*Exit,*UnloadImage,*ExitBootServices;
 void *GetNextMonotonicCount,*Stall;
 EFI_STATUS(EFIAPI *SetWatchdogTimer)(UINTN,uint64_t,UINTN,CHAR16*);
 void *ConnectController,*DisconnectController;
 void *OpenProtocol,*CloseProtocol,*OpenProtocolInformation,*ProtocolsPerHandle,*LocateHandleBuffer;
 EFI_STATUS(EFIAPI *LocateProtocol)(EFI_GUID*,void*,void**);
};
typedef struct EFI_RUNTIME_SERVICES EFI_RUNTIME_SERVICES;
struct EFI_RUNTIME_SERVICES {
 char header[24];
 void *GetTime,*SetTime,*GetWakeupTime,*SetWakeupTime,*SetVirtualAddressMap,*ConvertPointer;
 void *GetVariable,*GetNextVariableName,*SetVariable,*GetNextHighMonotonicCount;
 void (EFIAPI *ResetSystem)(uint32_t,EFI_STATUS,UINTN,CHAR16*);
};
typedef struct {char header[24];CHAR16 *FirmwareVendor;uint32_t FirmwareRevision;EFI_HANDLE ConsoleInHandle;EFI_SIMPLE_TEXT_INPUT_PROTOCOL *ConIn;EFI_HANDLE ConsoleOutHandle;void *ConOut;EFI_HANDLE StandardErrorHandle;void *StdErr;EFI_RUNTIME_SERVICES *RuntimeServices;EFI_BOOT_SERVICES *BootServices;UINTN NumberOfTableEntries;void *ConfigurationTable;} EFI_SYSTEM_TABLE;
static const EFI_GUID EFI_GRAPHICS_OUTPUT_PROTOCOL_GUID = {0x9042a9de,0x23dc,0x4a38,{0x96,0xfb,0x7a,0xde,0xd0,0x80,0x51,0x6a}};
#endif
