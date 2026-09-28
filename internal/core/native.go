package core

import (
	"encoding/base64"
	"fmt"
	"html"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"syscall"
)

// getNativeApps returns all natively tracked apps
func (a *App) getNativeApps() []AppModel {
	return readNativeConfig()
}

// AddNativeApp adds a new native app to the configuration
func (a *App) AddNativeApp(name string, execPath string, icon string) bool {
	apps := readNativeConfig()

	// Check if already exists
	for _, app := range apps {
		if app.ID == execPath {
			return false
		}
	}

	if icon == "" {
		if strings.HasSuffix(strings.ToLower(execPath), ".appimage") {
			icon = a.extractAppImageIcon(name, execPath)
		}
		if icon == "" {
			icon = "🚀" // Default icon
		}
	}

	newApp := AppModel{
		ID:   execPath,
		Name: name,
		Type: "Native",
		Icon: icon,
		Permissions: Permissions{
			Network:        true,
			Camera:         true,
			Microphone:     true,
			Display:        true,
			GPU:            true,
			DBus:           true,
			FSHome:         true,
			FSHost:         false, // restrict host by default to be safe
			AudioOutput:    true,
			Virtualization: false,
		},
	}

	apps = append(apps, newApp)
	err := writeNativeConfig(apps)
	return err == nil
}

// RemoveNativeApp removes a native app from tracking
func (a *App) RemoveNativeApp(appID string) bool {
	apps := readNativeConfig()
	var newApps []AppModel
	for _, app := range apps {
		if app.ID != appID {
			newApps = append(newApps, app)
		} else {
			if strings.HasSuffix(strings.ToLower(app.ID), ".appimage") {
				reg := regexp.MustCompile("[^a-zA-Z0-9]+")
				safeName := reg.ReplaceAllString(app.Name, "")
				if safeName == "" {
					safeName = "app"
				}
				home, err := os.UserHomeDir()
				if err == nil {
					cacheDir := filepath.Join(home, ".cache", "fencd", "appimages", fmt.Sprintf("fencd-%s", safeName))
					os.RemoveAll(cacheDir)
				}
			}
		}
	}
	err := writeNativeConfig(newApps)
	return err == nil
}

// getBwrapArgs generates the bubblewrap arguments for a given app
func (a *App) getBwrapArgs(targetApp *AppModel) []string {
	args := []string{
		"--ro-bind", "/", "/", // Base filesystem is read-only
		"--dev", "/dev",
		"--proc", "/proc",
		"--bind", "/tmp", "/tmp", // tmp must be writable for apps to function
		"--tmpfs", "/dev/shm", // Chromium IPC requires a writable /dev/shm
	}

	if targetApp.Permissions.DBus {
		args = append(args, "--bind", "/run", "/run") // run is often needed for sockets/DBus
	} else {
		args = append(args, "--tmpfs", "/run") // hide dbus sockets
	}

	if targetApp.Permissions.Display {
		// Explicitly bind Wayland socket if it exists (in case /run is a tmpfs when DBus is false)
		waylandDisplay := os.Getenv("WAYLAND_DISPLAY")
		if waylandDisplay == "" {
			waylandDisplay = "wayland-0"
		}
		uid := os.Getuid()
		waylandSocket := fmt.Sprintf("/run/user/%d/%s", uid, waylandDisplay)
		if _, err := os.Stat(waylandSocket); err == nil {
			args = append(args, "--dir", fmt.Sprintf("/run/user/%d", uid))
			args = append(args, "--bind", waylandSocket, waylandSocket)
		}
	} else {
		args = append(args, "--tmpfs", "/tmp/.X11-unix") // hide X11 sockets
	}

	if targetApp.Permissions.GPU {
		if _, err := os.Stat("/dev/dri"); err == nil {
			args = append(args, "--dev-bind", "/dev/dri", "/dev/dri") // Hardware acceleration
		}
	}

	if targetApp.Permissions.Virtualization {
		if _, err := os.Stat("/dev/kvm"); err == nil {
			args = append(args, "--dev-bind", "/dev/kvm", "/dev/kvm") // KVM Virtualization
		}
	}

	// Network
	if !targetApp.Permissions.Network {
		args = append(args, "--unshare-net")
	}

	// Filesystem
	home, _ := os.UserHomeDir()

	if targetApp.Permissions.FSHost {
		// If they want host write access, we bind / read-write
		args = append(args, "--bind", "/", "/")
	} else if targetApp.Permissions.FSHome {
		args = append(args, "--bind", home, home)
	} else {
		// Create a tmpfs on home by default to block access
		args = append(args, "--tmpfs", home)
	}

	if targetApp.Permissions.AudioOutput {
		uid := os.Getuid()
		pulseRun := fmt.Sprintf("/run/user/%d/pulse", uid)
		if _, err := os.Stat(pulseRun); err == nil {
			args = append(args, "--dir", fmt.Sprintf("/run/user/%d", uid))
			args = append(args, "--bind", pulseRun, pulseRun)
		}
	}

	args = append(args, targetApp.ID)
	return args
}

// LaunchNativeApp launches a native app inside a Bubblewrap sandbox
func (a *App) LaunchNativeApp(appID string) bool {
	apps := readNativeConfig()
	var targetApp *AppModel
	for _, app := range apps {
		if app.ID == appID {
			targetApp = &app
			break
		}
	}

	if targetApp == nil {
		return false
	}

	args := a.getBwrapArgs(targetApp)

	var cmd *exec.Cmd
	if strings.HasSuffix(strings.ToLower(targetApp.ID), ".appimage") {
		reg := regexp.MustCompile("[^a-zA-Z0-9]+")
		safeName := reg.ReplaceAllString(targetApp.Name, "")
		if safeName == "" {
			safeName = "app"
		}
		wrapperPath, err := a.generateAppImageWrapper(targetApp, safeName, args)
		if err == nil {
			cmd = exec.Command(wrapperPath)
		} else {
			cmd = exec.Command("bwrap", args...)
		}
	} else {
		cmd = exec.Command("bwrap", args...)
	}

	cmd.SysProcAttr = &syscall.SysProcAttr{
		Setpgid: true,
	}

	err := cmd.Start()
	if err == nil {
		go func() {
			cmd.Wait()
		}()
	}
	return err == nil
}

// CreateDesktopShortcut generates a .desktop file to launch the sandboxed app
func (a *App) CreateDesktopShortcut(appID string, customName string, customIcon string) bool {
	apps := readNativeConfig()
	var targetApp *AppModel
	for _, app := range apps {
		if app.ID == appID {
			targetApp = &app
			break
		}
	}
	if targetApp == nil {
		return false
	}

	args := a.getBwrapArgs(targetApp)

	nameToUse := targetApp.Name
	if customName != "" {
		nameToUse = customName
	}

	iconToUse := targetApp.Icon
	if customIcon != "" {
		iconToUse = customIcon
	}

	reg := regexp.MustCompile("[^a-zA-Z0-9]+")
	safeName := reg.ReplaceAllString(nameToUse, "")
	if safeName == "" {
		safeName = "app"
	}

	var execCmd string
	if strings.HasSuffix(strings.ToLower(targetApp.ID), ".appimage") {
		wrapperPath, err := a.generateAppImageWrapper(targetApp, safeName, args)
		if err == nil {
			execCmd = fmt.Sprintf("\"%s\"", wrapperPath)
		}
	}

	if execCmd == "" {
		var execStrBuilder strings.Builder
		execStrBuilder.WriteString("bwrap")
		for _, arg := range args {
			if strings.Contains(arg, " ") {
				execStrBuilder.WriteString(fmt.Sprintf(" \"%s\"", arg))
			} else {
				execStrBuilder.WriteString(" " + arg)
			}
		}
		execCmd = execStrBuilder.String()
	}

	desktopContent := fmt.Sprintf(`[Desktop Entry]
Name=%s (Fencd Sandbox)
Exec=%s %%U
Type=Application
Terminal=false
Categories=Utility;
`, nameToUse, execCmd)

	home, _ := os.UserHomeDir()
	appsDir := filepath.Join(home, ".local", "share", "applications")
	os.MkdirAll(appsDir, 0755)

	iconPath := ""
	if strings.HasPrefix(iconToUse, "data:image/") {
		parts := strings.Split(iconToUse, ",")
		if len(parts) == 2 {
			decoded, err := base64.StdEncoding.DecodeString(parts[1])
			if err == nil {
				iconsDir := filepath.Join(home, ".local", "share", "icons")
				os.MkdirAll(iconsDir, 0755)
				iconPath = filepath.Join(iconsDir, fmt.Sprintf("fencd-%s.png", safeName))
				os.WriteFile(iconPath, decoded, 0644)
			}
		}
	} else if iconToUse != "" {
		iconsDir := filepath.Join(home, ".local", "share", "icons")
		os.MkdirAll(iconsDir, 0755)
		iconPath = filepath.Join(iconsDir, fmt.Sprintf("fencd-%s.svg", safeName))
		svgContent := fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <text x="50" y="50" font-size="80" text-anchor="middle" dy="28">%s</text>
</svg>`, html.EscapeString(iconToUse))
		os.WriteFile(iconPath, []byte(svgContent), 0644)
	}

	if iconPath != "" {
		desktopContent += fmt.Sprintf("Icon=%s\n", iconPath)
	}

	desktopFile := filepath.Join(appsDir, fmt.Sprintf("fencd-%s.desktop", safeName))
	err := os.WriteFile(desktopFile, []byte(desktopContent), 0755)
	if err == nil {
		os.Chmod(desktopFile, 0755)
	}

	return err == nil
}

func (a *App) toggleNativePermission(appID string, permission string, enable bool) bool {
	apps := readNativeConfig()
	found := false
	for i, app := range apps {
		if app.ID == appID {
			found = true
			switch permission {
			case "network":
				apps[i].Permissions.Network = enable
			case "fshome":
				apps[i].Permissions.FSHome = enable
			case "fshost":
				apps[i].Permissions.FSHost = enable
			case "audiooutput":
				apps[i].Permissions.AudioOutput = enable
			case "virtualization":
				apps[i].Permissions.Virtualization = enable
			case "camera":
				apps[i].Permissions.Camera = enable
			case "microphone":
				apps[i].Permissions.Microphone = enable
			case "display":
				apps[i].Permissions.Display = enable
			case "gpu":
				apps[i].Permissions.GPU = enable
			case "dbus":
				apps[i].Permissions.DBus = enable
			default:
				return false
			}
			break
		}
	}
	if !found {
		return false
	}
	err := writeNativeConfig(apps)
	return err == nil
}

func (a *App) generateAppImageWrapper(targetApp *AppModel, safeName string, args []string) (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	wrapperDir := filepath.Join(home, ".local", "share", "fencd", "wrappers")
	os.MkdirAll(wrapperDir, 0755)
	wrapperPath := filepath.Join(wrapperDir, fmt.Sprintf("fencd-%s.sh", safeName))

	cacheDir := filepath.Join(home, ".cache", "fencd", "appimages", fmt.Sprintf("fencd-%s", safeName))

	script := fmt.Sprintf(`#!/bin/bash
APPIMAGE="%s"
CACHE_DIR="%s"

CURRENT_STAT=$(stat -c '%%Y-%%s' "$APPIMAGE" 2>/dev/null || echo "unknown")

if [ ! -f "$CACHE_DIR/.extracted" ] || [ "$(cat "$CACHE_DIR/.extracted" 2>/dev/null)" != "$CURRENT_STAT" ]; then
    rm -rf "$CACHE_DIR"
    mkdir -p "$CACHE_DIR"
    cd "$CACHE_DIR"
    "$APPIMAGE" --appimage-extract > /dev/null
    echo "$CURRENT_STAT" > "$CACHE_DIR/.extracted"
fi

BWRAP_ARGS=(
`, targetApp.ID, cacheDir)

	for _, arg := range args[:len(args)-1] {
		script += fmt.Sprintf("  %q\n", arg)
	}

	script += `  "--setenv" "APPDIR" "$CACHE_DIR/squashfs-root"
  "$CACHE_DIR/squashfs-root/AppRun"
)

if [ -f "$CACHE_DIR/squashfs-root/chrome-sandbox" ]; then
    BWRAP_ARGS+=("--no-sandbox" "--disable-gpu-sandbox")
fi

exec bwrap "${BWRAP_ARGS[@]}" "$@"
`
	err = os.WriteFile(wrapperPath, []byte(script), 0755)
	return wrapperPath, err
}

func (a *App) extractAppImageIcon(name string, execPath string) string {
	reg := regexp.MustCompile("[^a-zA-Z0-9]+")
	safeName := reg.ReplaceAllString(name, "")
	if safeName == "" {
		safeName = "app"
	}
	home, _ := os.UserHomeDir()
	cacheDir := filepath.Join(home, ".cache", "fencd", "appimages", fmt.Sprintf("fencd-%s", safeName))

	os.MkdirAll(cacheDir, 0755)

	statCmd := exec.Command("stat", "-c", "%Y-%s", execPath)
	out, err := statCmd.Output()
	currentStat := "unknown"
	if err == nil {
		currentStat = strings.TrimSpace(string(out))
	}

	extractedStatFile := filepath.Join(cacheDir, ".extracted")
	extractedStat, err := os.ReadFile(extractedStatFile)
	if err != nil || strings.TrimSpace(string(extractedStat)) != currentStat {
		os.RemoveAll(cacheDir)
		os.MkdirAll(cacheDir, 0755)
		extractCmd := exec.Command(execPath, "--appimage-extract")
		extractCmd.Dir = cacheDir
		err = extractCmd.Run()
		if err == nil {
			os.WriteFile(extractedStatFile, []byte(currentStat), 0644)
		} else {
			return ""
		}
	}

	dirIconPath := filepath.Join(cacheDir, "squashfs-root", ".DirIcon")
	if _, err := os.Stat(dirIconPath); err == nil {
		return fileToBase64(dirIconPath)
	}

	return ""
}
