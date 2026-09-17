window.fogData = [
    {
        id: "fog_my7",
        name: "MyUI 7",
        device: "Xiaomi Redmi 10C (fog)",
        version: "Android 15 (Hotfix)",
        buildDate: "2026-03-26",
        downloadUrl: "https://drive.google.com/file/d/1OmNmmazHOZxB_R6jJfEcipuuLVtdPOVD/view?usp=drive_link",
        banner: "assets/roms/fog/myui/banner.jpg",
        screenshots: [
            "assets/roms/fog/myui/1.jpg",
            "assets/roms/fog/myui/2.jpg",
            "assets/roms/fog/myui/3.jpg",
            "assets/roms/fog/myui/4.jpg",
            "assets/roms/fog/myui/5.jpg"
        ],
        description: "### Notes\n- CN variant (dirty flashing from Global is NOT recommended)\n- **EROFS:** Only use an EROFS-supported kernel (this ROM is EROFS)\n- Install Play Store from App Center or download directly from [here](https://t.me/bscotchsdump/100)\n- Certain Lenovo features require a Chinese Lenovo account\n- Allow the ROM to settle for ~10 minutes after initial boot\n- Initial flashing may take around 10 minutes — please be patient!",
        flashInstruction: "### Installation Steps\n> ⚠️ **Please follow these steps carefully!**\n\n1. Use [OrangeFox Recovery](https://t.me/Redmi10CUpdates/1089) for flashing\n2. Flash [EROFS Kernel](https://t.me/bscotchsdump/243) first\n3. Reboot to Recovery\n4. Flash the ROM zip file\n5. Flash [FRP Remover](https://t.me/bscotchsdump/256) (recommended precaution)\n6. Format Data\n7. Reboot to system",
        credits: "- [가온누리](https://www.pixiv.net/en/users/92722352) for artwork\n- @ZetLinkUwU for RIL fix\n- @reiryuki and @KanagawaYamadaVTeacher for Dolby fix\n- @panzzxz for lag fix\n- @Damarrr25 for help"
    },
    {
        id: "fog_hos2lcn",
        name: "HyperOS 2 Lite",
        device: "Xiaomi Redmi 10C (fog)",
        version: "Android 14 (Hotfix 2)",
        buildDate: "2026-04-26",
        downloadUrl: "https://drive.google.com/file/d/1jkkBCXp5j5Hyne23dPzfgqPQ0ujFS7Vb/view?usp=sharing",
        banner: "assets/roms/fog/h2cn_lisa/banner.jpg",
        screenshots: [
            "assets/roms/fog/h2cn_lisa/1.jpg",
            "assets/roms/fog/h2cn_lisa/2.jpg",
            "assets/roms/fog/h2cn_lisa/3.jpg",
            "assets/roms/fog/h2cn_lisa/4.jpg",
            "assets/roms/fog/h2cn_lisa/5.jpg"
        ],
        description: "### Changes\n- Fixed device spoofing issue that caused several features to stop working\n- Removed HyperAI bloat\n- Unlimited Google Photos original quality backup\n- Lite Mode disabled by default\n- Low Memory Killer (LMK) optimizations to prevent OutOfMemory crashes\n- General system and responsiveness optimizations\n\n### Notes\n- Pre-rooted with KernelSU Next 3.0.0 and OrangeFox Recovery\n- Not recommended to change the kernel\n\n### Known Issues\n- NFC may be unstable on rain variant",
        flashInstruction: "### Installation Steps\n1. Boot into any custom recovery (OrangeFox recommended)\n2. Flash the ROM zip file\n3. Format Data\n4. Change active boot slot to **'a'** in the Reboot menu (if not already set)\n5. Reboot to system\n\n> ℹ️ **Note:** Performing any manual \"Wipe\" is NOT needed.",
        credits: "- @crazyguidesformi, @kashis_cringey_stuffs, Useful collection for mods\n- Unknown creator for artwork\n- @Romeo_13card for OrangeFox build"
    },
    {
        id: "fog_ho3lcn",
        name: "HyperOS 3 Lite",
        device: "Xiaomi Redmi 10C (fog)",
        version: "Android 15 (Initial)",
        buildDate: "2026-05-15",
        downloadUrl: "",
        banner: "assets/roms/fog/h3cn_socrates/banner.jpg",
        screenshots: [
            "assets/roms/fog/h3cn_socrates/1.jpg",
            "assets/roms/fog/h3cn_socrates/2.jpg",
            "assets/roms/fog/h3cn_socrates/3.jpg",
            "assets/roms/fog/h3cn_socrates/4.jpg"
        ],
        description: "### Notes\n- System performs dex2oat compilation on first boot; device may briefly lag or heat up until a completion notification is shown\n- Lite Mode and Device Spoof toggles are located in Developer Options\n- Setup Wizard is skipped by default\n- Do NOT change the kernel (kernel locked)\n- Shipped with KernelSU Next (v3.2.0-legacy) and OrangeFox Recovery\n\n### Known Issues\n- NFC on rain variant is untested",
        flashInstruction: "### Installation Steps\n1. Boot into custom recovery (OrangeFox by @Romeo_13card recommended)\n2. Flash the ROM zip file\n3. Format Data\n4. Reboot to system\n\n> ℹ️ **Note:** Performing any manual \"Wipe\" is NOT needed.",
        credits: "- @crazyguidesformi, @kashis_cringey_stuffs, Useful collection for mods\n- @Romeo_13card for OrangeFox build\n- @ProjectUnknown01 for original ROM flasher (RapidFlasher)"
    },
    {
        id: "fog_nos",
        name: "NothingOS 4.1",
        device: "Xiaomi Redmi 10C (fog)",
        version: "Android 16 (Initial)",
        buildDate: "2026-05-26",
        downloadUrl: "https://drive.google.com/file/d/1oAET8kS9tbrvFre2QlrvHAeOXZGPP0-J/view?usp=sharing",
        banner: "assets/roms/fog/nothing/banner.jpg",
        screenshots: [
            "assets/roms/fog/nothing/1.jpg",
            "assets/roms/fog/nothing/2.jpg",
            "assets/roms/fog/nothing/3.jpg",
            "assets/roms/fog/nothing/4.jpg"
        ],
        description: "### Notes\n- System performs dex2oat compilation on first boot\n- Kernel is locked for stability\n- Includes ViPER4Android FX (accessible in Sound settings)\n- Shipped with KernelSU Next (v3.2.0-legacy) and OrangeFox Recovery\n- NFC is fully functional\n\n### Known Issues\n- Some UI elements may scale unusually on 720p displays (originally designed for 1080p)\n- Dirac Audio (requires 64-bit audio service)\n- Face Unlock\n- Double Tap to Wake (DT2W) unsupported by Nothing base",
        flashInstruction: "### Installation Steps\n1. Boot into custom recovery (OrangeFox by @Romeo_13card recommended)\n2. Flash the ROM zip file\n3. Format Data\n4. Reboot to system\n\n> ℹ️ **Note:** Performing any manual \"Wipe\" is NOT needed.",
        credits: "- [hori](https://www.pixiv.net/en/users/74658564) for background artwork\n- @Romeo_13card for testing and OrangeFox"
    },
    {
        id: "fog_mi12eea",
        name: "MIUI 12 EEA",
        device: "Xiaomi Redmi 10C (fog)",
        version: "Android 11 (Initial)",
        buildDate: "2026-06-09",
        downloadUrl: "",
        banner: "assets/roms/fog/mi12sweet/banner.jpg",
        screenshots: [
            "assets/roms/fog/mi12sweet/1.jpg",
            "assets/roms/fog/mi12sweet/2.jpg",
            "assets/roms/fog/mi12sweet/3.jpg",
            "assets/roms/fog/mi12sweet/4.jpg"
        ],
        description: "### Notes\n- System performs dex2oat compilation on first boot; device may briefly lag or heat up until a completion notification is shown\n- Erasing the FRP partition is **strongly discouraged**\n- Non-rooted by default\n- NFC is fully working on rain variant\n- Shipped with Stock Kernel and TWRP 3.6",
        flashInstruction: "### Installation Steps\n1. Boot into any custom recovery\n2. Flash the ROM zip file\n3. Format Data\n4. Change active boot slot to **'a'** in the Reboot menu (if not already set)\n5. Reboot to system\n\n> ℹ️ **Note:** Performing any manual \"Wipe\" is NOT needed.",
        credits: "- @Romeo_13card for testing\n- @ProjectUnknown01 for original ROM flasher (RapidFlasher)\n- [トキアライキTOKIARAIき](https://www.pixiv.net/en/users/4767426) for artwork"
    },
    {
        id: "fog_mi125cn",
        name: "MIUI 12.5 CN",
        device: "Xiaomi Redmi 10C (fog)",
        version: "Android 11 (Hotfix)",
        buildDate: "2026-07-12",
        cssSuffix: "-sakura",
        downloadUrl: "https://drive.google.com/file/d/1ap-4_Y0xUBHxIhqRAkwNnCxZmq03ACe8/view?usp=sharing",
        banner: "assets/roms/fog/mi125/banner.png",
        screenshots: [
            "assets/roms/fog/mi125/1.jpg",
            "assets/roms/fog/mi125/2.jpg",
            "assets/roms/fog/mi125/3.jpg",
            "assets/roms/fog/mi125/4.jpg",
            "assets/roms/fog/mi125/5.jpg",
            "assets/roms/fog/mi125/6.jpg"
        ],
        description: "> *\"Let’s turn around and watch the sun, before it goes down completely.\"*\n\n### Changes\n- Fixed system freezes caused by OutOfMemory (OOM)\n- Fixed Zygote binary fork process spamming crash (resolved overheating)\n- General performance improvements and under-the-hood optimizations\n\n### Notes\n- **Custom Kernels:** NOT recommended. Issues encountered while using custom kernels will not be supported\n- Non-rooted by default\n- Shipped with Stock Kernel and TWRP 3.6\n- NFC is working on rain variant",
        flashInstruction: "### Installation Steps\n1. Boot into any custom recovery\n2. Flash the ROM zip file\n3. Format Data\n4. Reboot to system\n\n> ℹ️ **Note:** Performing any manual \"Wipe\" is NOT needed.",
        credits: "- @kipasangin089, @Romeo_13card for testing\n- [nebbeli](https://x.com/nebbeli) for this amazing artwork\n- @ProjectUnknown01 for original ROM flasher (RapidFlasher)"
    },
    {
        id: "fog_hos3id",
        name: "HyperOS 3.1 ID",
        device: "Xiaomi Redmi 10C (fog)",
        version: "Android 16 (Initial)",
        buildDate: "2026-07-21",
        isPersonal: false,
        downloadUrl: "https://drive.google.com/file/d/1eSxfdxrAr2F4J9e-3SPRX9jbSKUa3bNJ/view?usp=sharing",
        banner: "assets/roms/fog/hos3id/banner.png",
        screenshots: [
            "assets/roms/fog/hos3id/1.jpg",
            "assets/roms/fog/hos3id/2.jpg",
            "assets/roms/fog/hos3id/3.jpg",
            "assets/roms/fog/hos3id/4.jpg",
            "assets/roms/fog/hos3id/5.jpg",
            "assets/roms/fog/hos3id/6.jpg",
            "assets/roms/fog/hos3id/7.jpg"
        ],
        description: "> *\"Hee hee, what's going on? Is the whole world revolving?\"*\n\n### Notes\n- **EROFS Build:** System partitions are read-only\n- **Custom Kernels:** NOT recommended. Custom kernel issues will not receive support\n- Allow the ROM to settle for a few minutes after initial boot\n- Non-rooted by default\n- Shipped with AOSP Kernel and TWRP Recovery\n\n### Extra Files\n- [Folkpatched Boot Image](https://t.me/archivebsct2/26)\n\n### Known Issues\n- Certain apps may fail to detect pinch-to-zoom gestures\n- Screen color calibration options are currently non-functional",
        flashInstruction: "### Installation Steps\n1. Boot into any custom recovery\n2. Flash the ROM zip file\n3. Format Data\n4. Reboot to system\n\n> ℹ️ **Note:** Performing any manual \"Wipe\" is NOT needed.",
        credits: "- @jopvan1 for HWC fixes\n- @nathannxx for assistance\n- @kashis_cringey_stuffs for mods\n- @Mnskkyy for Mi Camera\n- @Romeo_13card and @Bangkong_sawah for testing"
    }
];
