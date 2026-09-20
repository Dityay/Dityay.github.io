window.earthData = [
    {
        id: "earth_origin",
        name: "OriginOS 4",
        category: "Non-Xiaomi",
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
        description: "### Changes\n- Default CPU governor set to powersave\n- Restored app transition animations\n- Fixed home screen layout\n- Removed AOD (Always-On Display) option\n- Fixed dead sensor issue\n- Reduced swappiness to 125\n- Fixed random reboot issue\n- Added ViPER4Android FX (accessible from Sound settings)\n- Set SELinux to Permissive\n\n### Known Issues\n- exFAT SD Card is NOT supported\n- MTP is broken (use ADB commands or ADB Explorer app from PC)\n\n### Notes\n- Do NOT enable Live Blur (unsupported by vendor/CPU and may freeze the device)",
        flashInstruction: "### Installation Steps\n1. Reboot into custom recovery (TWRP / OrangeFox)\n2. Wipe Dalvik, Cache, and Data\n3. Format Data (type `yes` to confirm)\n4. Flash the ROM zip file\n5. Reboot to system\n\n> ⚠️ **Important:** Back up all essential data before formatting data.",
        credits: "- @Damarrr25 for development help\n- @panzzxz for sensor fixing clues\n- @kiellzz1 for this amazing banner\n- @note11shype for base and assistance\n- Dadobye for Vivo HALs"
    }
];
