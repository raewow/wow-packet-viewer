fn main() {
    // Embed the Windows application manifest requesting admin privileges.
    // This makes the exe auto-elevate (UAC prompt) when launched.
    #[cfg(target_os = "windows")]
    embed_resource::compile("app.rc", embed_resource::NONE);

    tauri_build::build()
}
