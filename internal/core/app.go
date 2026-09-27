package core

import (
	"context"
	"os/exec"
	"strings"
	"syscall"
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
func (a *App) GetApps() []AppModel {
	apps := []AppModel{}
	apps = append(apps, a.getFlatpaks()...)
	apps = append(apps, a.getSnaps()...)
	apps = append(apps, a.getNativeApps()...)
	return apps
}

// LaunchApp launches an app based on its type
func (a *App) LaunchApp(appID string, appType string) bool {
	if appType == "Native" {
		return a.LaunchNativeApp(appID)
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
		return a.toggleFlatpakPermission(appID, permission, enable)
	case "Snap":
		return a.toggleSnapPermission(appID, permission, enable)
	case "Native":
		return a.toggleNativePermission(appID, permission, enable)
	}
	return false
}
