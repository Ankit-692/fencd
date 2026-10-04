package core

import (
	"context"
	"os/exec"
	"strings"
	"syscall"

	"fencd/internal/desktop"
	"fencd/internal/flatpak"
	"fencd/internal/models"
	"fencd/internal/native"
	"fencd/internal/snap"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// Startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

// GetApps returns all installed apps across all supported managers
func (a *App) GetApps() []models.AppModel {
	apps := []models.AppModel{}
	apps = append(apps, flatpak.GetApps()...)
	apps = append(apps, snap.GetApps()...)
	apps = append(apps, native.GetApps()...)
	return apps
}

// LaunchApp launches an app based on its type
func (a *App) LaunchApp(appID string, appType string) bool {
	if appType == "Native" {
		return native.LaunchApp(appID)
	}

	var cmd *exec.Cmd
	switch appType {
	case "Flatpak":
		cmd = exec.Command("flatpak", "run", appID)
	case "Snap":
		cmd = exec.Command("snap", "run", appID) // "snap run appID" is standard
	default:
		return false
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

// TogglePermission toggles a specific permission for an application
func (a *App) TogglePermission(appID string, appType string, permission string, enable bool) bool {
	permission = strings.ToLower(permission)
	switch appType {
	case "Flatpak":
		return flatpak.TogglePermission(appID, permission, enable)
	case "Snap":
		return snap.TogglePermission(appID, permission, enable)
	case "Native":
		return native.TogglePermission(appID, permission, enable)
	}
	return false
}

// GetSystemApps reads installed applications from desktop files
func (a *App) GetSystemApps() []models.SystemApp {
	return desktop.GetSystemApps()
}

// AddNativeApp adds a new native app to the configuration
func (a *App) AddNativeApp(name string, execPath string, icon string) bool {
	return native.AddNativeApp(name, execPath, icon)
}

// RemoveNativeApp removes a native app from tracking
func (a *App) RemoveNativeApp(appID string) bool {
	return native.RemoveNativeApp(appID)
}

// CreateDesktopShortcut generates a .desktop file to launch the sandboxed app
func (a *App) CreateDesktopShortcut(appID string, customName string, customIcon string) bool {
	return native.CreateDesktopShortcut(appID, customName, customIcon)
}

// SelectExecutable opens a native file dialog to select an executable or AppImage
func (a *App) SelectExecutable() (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Executable or AppImage",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Executables (*.AppImage, *.sh, *.bin)",
				Pattern:     "*.AppImage;*.sh;*.bin",
			},
			{
				DisplayName: "All Files",
				Pattern:     "*",
			},
		},
	})
}
