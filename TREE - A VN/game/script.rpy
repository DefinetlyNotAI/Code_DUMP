# Then fix images sfx and audio styled and improve story

# Available fonts: custom_font_you (YOU.tff), custom_font_narrator (NARRATOR.tff), 
# as well as manual custom_font_tree (font looks like a tree) and custom_font_me (creepy text as if handwritten scribbles)

define narrator = Character(
    "Narrator",
    what_font=custom_font_you,
    who_font=custom_font_me,
    window_left_padding=0,
    window_top_padding=10
)

define slow_dissolve = Dissolve(1.0)

image white_bg = Solid("#ffffff")

# Burning rose GIF split into animation, this acts as a background btw, 
# but isnt fullscreen so ensure background is black before playing
image burnflower = Animation(
    "images/burnflower/1.gif", 0.1,
    "images/burnflower/2.gif", 0.1,
    "images/burnflower/3.gif", 0.1,
    "images/burnflower/4.gif", 0.1,
    "images/burnflower/5.gif", 0.1,
    "images/burnflower/6.gif", 0.1,
    "images/burnflower/7.gif", 0.1,
    "images/burnflower/8.gif", 0.1,
    "images/burnflower/9.gif", 0.1,
    "images/burnflower/10.gif", 0.1,
    "images/burnflower/11.gif", 0.1,
    "images/burnflower/12.gif", 0.1,
    "images/burnflower/13.gif", 0.1,
    "images/burnflower/14.gif", 0.1,
    "images/burnflower/15.gif", 0.1,
    "images/burnflower/16.gif", 0.1,
    "images/burnflower/17.gif", 0.1,
    loop=True
)

# Buncha emoji smiles that are disturbing, used after a glitch segment involving clocks, 
# (static.mp3) should play for this duration btw
# A quick animation where no text should appear until complete
image clocksmiles = Animation(
    "images/clocksmiles/1.jpg", 0.05,
    "images/clocksmiles/2.jpg", 0.05,
    "images/clocksmiles/3.jpg", 0.05,
    "images/clocksmiles/4.jpg", 0.05,
    "images/clocksmiles/5.jpg", 0.05,
    "images/clocksmiles/6.jpg", 0.05,
    "images/clocksmiles/7.png", 0.05,
)

# Buncha emoji smiles that are disturbing, used after a glitch segment, (static.mp3) should play for this duration btw
# A quick animation where no text should appear until complete
image smile = Animation(
    "images/smile/1.png", 0.05,
    "images/smile/2.png", 0.05,
    "images/smile/3.png", 0.05,
    "images/smile/4.png", 0.05,
    "images/smile/5.png", 0.05,
    "images/smile/6.png", 0.05,
    "images/smile/7.png", 0.05,
    "images/smile/8.png", 0.05,
    "images/smile/9.png", 0.05,
    "images/smile/10.jpeg", 0.05,
)

# Play this after the intro and content warnings, just a bunch of vague messages
# A quick animation where no text should appear until complete (even not allow text progression like pressing space or clicking)
image beforeitstarts = Animation(
    "images/beforeitallstarts/1.png", 4,
    "images/beforeitallstarts/2.png", 4,
    "images/beforeitallstarts/3.png", 3,
    "images/beforeitallstarts/4.png", 4,
    "images/beforeitallstarts/5.png", 4,
    "images/beforeitallstarts/6.png", 4,
    "images/beforeitallstarts/7.png", 4,
    "images/beforeitallstarts/8.png", 4,
    "images/beforeitallstarts/9.png", 4,
)

# A quick animation where no text should appear until complete (even not allow text progression like pressing space or clicking) - used after a very weird segment, 
# it shows HELP crossed out many times, then it says forget everything you saw here, 
# and finally says none of it ever happened and ur just dreaming
# Between each image, play static.mp3 for like a second?
image forget = Animation(
    "images/forget/1.png", 6,
    "images/forget/2.png", 5,
    "images/forget/3.png", 4,
)

# Bunch of error bar screens (like wewillberightback.png) but each one says SO, MANY, SAVE, SLOTS
# A quick animation where no text should appear until complete (even not allow text progression like pressing space or clicking) - used after a segment in between wewillberightback.png, 
image glitch = Animation(
    "images/wewillberightback.png", 3,
    "images/glitch/1.png", 2,
    "images/glitch/2.png", 2,
    "images/glitch/3.png", 2,
    "images/glitch/4.png", 2,
    "images/wewillberightback.png", 3,
)


# Music
define audio.aholyplace = "audio/mus/aholyplacewhereudontexist.mp3"
define audio.bloodandtears = "audio/mus/bloodandtears.mp3"
define audio.condescending = "audio/mus/condescending.mp3"
define audio.daisydaisy = "audio/mus/daisydaisy.mp3"
define audio.heartbeat = "audio/mus/heartbeat.mp3"
define audio.holy = "audio/mus/holy.mp3"
define audio.itsbroken = "audio/mus/itsbrokenitsbrokenitsbrokenitsbrokenitsbrokenitsbroken.mp3"
define audio.itsoktocry = "audio/mus/itsoktocry.mp3"
define audio.maybethereishope = "audio/mus/maybethereishopeafterall.mp3"
define audio.nohopeleft = "audio/mus/nohopeleft.mp3"
define audio.nowhereissafe = "audio/mus/nowhereissafe.mp3"
define audio.retrospect = "audio/mus/retrospect.mp3"
define audio.singwithme = "audio/mus/singwithmehowevercreepyitmaybe.mp3"
# SFX
define audio.computerboo = "audio/sfx/computerboo.mp3"
define audio.computeryay = "audio/sfx/computeryay.mp3"
define audio.crack = "audio/sfx/crack.mp3"
define audio.creepyknock = "audio/sfx/creepyknock.mp3"
define audio.error = "audio/sfx/error.mp3"
define audio.explosion = "audio/sfx/explosion.mp3"
define audio.happybaby = "audio/sfx/happybaby.mp3"
define audio.hum = "audio/sfx/humstillitgetslouder.mp3"
define audio.iamyou = "audio/sfx/iamyou.mp3"
define audio.scream = "audio/sfx/SCREAM.wav"
define audio.static = "audio/sfx/static.mp3"
# General Images
image three = "images/3.png"
image black = "images/black.png"
image bloodeye = "images/bloodeye.jpeg"
image brokenscreen = "images/brokenscreen.jpeg"
image burningsky = "images/burningsky.png"
image clock = "images/clock.png"
image destructionpoem = "images/destructionpoem.png"
image faceglitch = "images/faceglitch.jpeg"
image gougemyeyes = "images/gougemyeyes.png"
image roachofpain = "images/roachofpain.png"
image sad = "images/sad.png"
image whydowehurt = "images/whydowehurt.png"
image youtheclown = "images/youtheclown.webp"
# UI and Meta
image contentwarning = "images/contentwarning.png"
image connectionattempt = "images/connectionattempt.webp"
image ohno = "images/ohno.png"
image oopserrscreenfrog = "images/oopserrscreenfrog.png"
image wewillberightback = "images/wewillberightback.png"
image tobecontinued = "images/tobecontinued.png"
image turnoffanduninstall = "images/turnoffanduninstall.png"
image theend = "images/theend.png"
# HELP Series
image help1 = "images/help/1.png"
image help2 = "images/help/2.png"
image help3 = "images/help/3.png"
image help4 = "images/help/4.png"
# Rambling Series
image ramble1 = "images/rambling/1.png"
image ramble2 = "images/rambling/2.png"
image ramble3 = "images/rambling/3.png"
image ramble4 = "images/rambling/4.png"
# WTF Series - disturbing dead animals
image wtf1 = "images/wtf/1.png"
image wtf2 = "images/wtf/2.png"
image wtf3 = "images/wtf/3.png"
image wtf4 = "images/wtf/4.png"
image wtf5 = "images/wtf/5.png"


# REMAKE FULLY
label start:
    scene black
    show expression "images/contentwarning.png" as cw at truecenter
    play music "audio/mus/holy.mp3" fadein 1.0
    with dissolve
    pause 6.5
    stop music fadeout 1.0
    hide cw

    scene black
    play sound "audio/sfx/computeryay.mp3"
    $ renpy.pause(0.7)
    stop sound

    play music "audio/mus/daisydaisy.mp3"
    show beforeitstarts as beforeitstarts at truecenter
    $ renpy.pause(37.0, hard=True)
    hide beforeitstarts
    scene black

    play music "audio/mus/aholyplacewhereudontexist.mp3"
    show burnflower as bloom at truecenter
    narrator "You are not supposed to be here."
    $ renpy.pause(1.5)
    hide bloom
    jump intruder_detected
