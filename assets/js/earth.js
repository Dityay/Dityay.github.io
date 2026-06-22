window.earthData = [
    {
        id: "earth_origin",
        name: "OriginOS 4",
        device: "Xiaomi Redmi 12C (earth)",
        version: "Android 14 (Hotfix)",
        buildDate: "2025-11-03",
        downloadUrl: "https://drive.google.com/file/d/13yW0e2p1O1RusPl2m3Vhnj_dAYs_5oPt/view?usp=sharing",
        banner: "assets/roms/earth/origin/banner.jpg",
        screenshots: [
            "assets/roms/earth/origin/1.jpg",
            "assets/roms/earth/origin/2.jpg",
            "assets/roms/earth/origin/3.jpg",
            "assets/roms/earth/origin/4.jpg",
            "assets/roms/earth/origin/5.jpg"
        ],

        description: "### Changes\n- Default CPU governor is powersave\n- Return app transition animations\n- Fixed home screen layout\n- Removed AOD option\n- Fixed dead sensor\n- Reduce swappiness to 125\n- Fixed random reboot\n- Added viperfx (open from sounds settings)\n- Permissive SELinux",
        notes: "### Known Issues\n- EXFAT SDCARD IS NOT SUPPORTED.\n- Do NOT enable live blur, our vendor/cpu doesnt support it\n- MTP dead, you can use adb commands or ADB Explorer app from your PC (every originos port has this issue)",
        flashInstruction: "### Flashing Steps\n1. Reboot to custom recovery (TWRP/OrangeFox)\n2. Wipe Dalvik, Cache, Data\n3. Format Data (Type 'yes')\n4. Flash the ROM zip file\n5. Reboot to system",
        credits: "- @Damarrr25 for help\n- @panzzxz for sensor fixing clue\n- @kiellzz1 for this BEST banner\n- @note11shype for base and some help\n- Dadobye for Vivo hals"
    }
];
