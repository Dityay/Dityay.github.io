window.galeData = [
    {
        id: "gale_origin",
        name: "OriginOS 4",
        device: "Xiaomi Redmi 13C (gale)",
        version: "Android 14 (Initial)",
        buildDate: "2025-09-05",
        downloadUrl: "https://drive.google.com/file/d/1pYuwgiptSHt4_vLhwuJuSX3sPnKD2BjH/view?usp=sharing",
        banner: "assets/roms/gale/origin/banner.jpg",
        screenshots: [
            "assets/roms/gale/origin/1.jpg",
            "assets/roms/gale/origin/2.jpg",
            "assets/roms/gale/origin/3.jpg"
        ],
        description: "### Notes\n- **Clean Flash Mandatory:** Only flash from MIUI 14, HyperOS 1, or AOSP base!\n- Engineering preloader is NOT included\n- App transition animations are disabled by default\n- Do NOT enable Live Blur (CPU cannot handle it and will freeze)\n- If Dark Mode glitches, run in terminal: `su -c resetprop debug.hwui.force_dark false`\n\n### Known Issues\n- SIM Card restart issue — use [this Magisk module](https://t.me/DroidProjectCommunity/269578) to fix\n- MTP is broken (use ADB commands or ADB Explorer app from PC)\n- Home screen layout may scale unusually due to screen resolution differences",
        flashInstruction: "### Installation Steps\n1. Reboot into custom recovery (TWRP / OrangeFox)\n2. Wipe Dalvik, Cache, and Data\n3. Format Data (type `yes` to confirm)\n4. Flash the ROM zip file\n5. Reboot to system\n\n> ⚠️ **Warning:** ONLY flash from MIUI 14, HyperOS 1, or AOSP base!",
        credits: "- @Damarrr25 for teaching ports\n- @note11shype for base and assistance\n- @JanDimple for testing (as always)\n- @klikajatolol for Vivo HALs"
    }
];
