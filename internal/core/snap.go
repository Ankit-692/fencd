package core

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"
)

// getSnaps discovers all snap packages and their current permissions
func (a *App) getSnaps() []AppModel {
	var apps []AppModel

	cmd := exec.Command("snap", "list")
	var out bytes.Buffer
	cmd.Stdout = &out
	if err := cmd.Run(); err != nil {
		return apps // return empty if snap fails or isn't installed
	}

	lines := strings.Split(out.String(), "\n")
	for i, line := range lines {
		// Skip header and empty lines
		if i == 0 || strings.TrimSpace(line) == "" {
			continue
		}

		// "Name Version Rev Tracking Publisher Notes"
		fields := strings.Fields(line)
		if len(fields) > 0 {
			appName := fields[0]

			// Snap core packages that shouldn't be managed by users
			if appName == "core" || appName == "core18" || appName == "core20" || appName == "core22" || appName == "snapd" || appName == "bare" || appName == "gtk-common-themes" || appName == "gnome-3-38-2004" {
				continue
			}

			permissions := a.getSnapPermissions(appName)

			icon := getSystemIconBase64(appName)
			if icon == "" {
				icon = "🦊" // Snap icon fallback
			}

			apps = append(apps, AppModel{
				ID:          appName,
				Name:        appName, // Snaps usually don't provide a human-readable title in `snap list`
				Type:        "Snap",
				Icon:        icon,
				Permissions: permissions,
			})
		}
	}
	return apps
}

func (a *App) getSnapPermissions(appName string) Permissions {
	cmd := exec.Command("snap", "connections", appName)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Run()

	perms := Permissions{
		Network:        false,
		Camera:         false,
		Microphone:     false,
		Display:        false,
		GPU:            false,
		DBus:           false,
		FSHome:         false,
		FSHost:         false,
		AudioOutput:    false,
		Virtualization: false,
	}

	lines := strings.Split(out.String(), "\n")
	for i, line := range lines {
		// Skip header
		if i == 0 || strings.TrimSpace(line) == "" {
			continue
		}

		fields := strings.Fields(line)
		// format: Interface Plug Slot Notes
		if len(fields) >= 3 {
			interfaceName := fields[0]
			slot := fields[2]
			isConnected := slot != "-"

			switch interfaceName {
			case "network", "network-bind":
				if isConnected {
					perms.Network = true
				}
			case "home", "personal-files":
				if isConnected {
					perms.FSHome = true
				}
			case "system-files", "removable-media", "block-devices":
				if isConnected {
					perms.FSHost = true
				}
			case "kvm":
				if isConnected {
					perms.Virtualization = true
				}
			case "camera":
				if isConnected {
					perms.Camera = true
				}
			case "audio-playback":
				if isConnected {
					perms.AudioOutput = true
				}
			case "audio-record":
				if isConnected {
					perms.Microphone = true
				}
			case "x11", "wayland", "desktop":
				if isConnected {
					perms.Display = true
				}
			case "opengl":
				if isConnected {
					perms.GPU = true
				}
			case "dbus":
				if isConnected {
					perms.DBus = true
				}
			}
		}
	}
	return perms
}

func (a *App) toggleSnapPermission(appID string, permission string, enable bool) bool {
	var interfaces []string

	switch permission {
	case "network":
		interfaces = []string{"network", "network-bind"}
	case "fshome":
		interfaces = []string{"home", "personal-files"}
	case "fshost":
		interfaces = []string{"system-files", "removable-media", "block-devices"}
	case "audiooutput":
		interfaces = []string{"audio-playback"}
	case "virtualization":
		interfaces = []string{"kvm"}
	case "camera":
		interfaces = []string{"camera"}
	case "microphone":
		interfaces = []string{"audio-record"}
	case "display":
		interfaces = []string{"x11", "wayland", "desktop"}
	case "gpu":
		interfaces = []string{"opengl"}
	case "dbus":
		interfaces = []string{"dbus"}
	default:
		return false
	}

	action := "disconnect"
	if enable {
		action = "connect"
	}

	hasHardError := false
	anyAttempted := false
	needsPkexec := false

	for _, iface := range interfaces {
		cmd := exec.Command("snap", action, appID+":"+iface)
		var stderr bytes.Buffer
		cmd.Stderr = &stderr
		err := cmd.Run()
		
		if err != nil {
			errStr := stderr.String()
			if strings.Contains(errStr, "access denied") || strings.Contains(errStr, "try with sudo") {
				needsPkexec = true
				break
			} else if !strings.Contains(errStr, "has no plug named") && !strings.Contains(errStr, "has no plug or slot") {
				hasHardError = true
			}
		}
		anyAttempted = true
	}

	if needsPkexec {
		var scriptBuilder strings.Builder
		for _, iface := range interfaces {
			scriptBuilder.WriteString(fmt.Sprintf("snap %s %s:%s; ", action, appID, iface))
		}
		
		cmdPk := exec.Command("pkexec", "sh", "-c", scriptBuilder.String())
		var stderrPk bytes.Buffer
		cmdPk.Stderr = &stderrPk
		errPk := cmdPk.Run()
		
		hasHardError = false // Reset since we are re-evaluating with pkexec
		if errPk != nil {
			errPkStr := stderrPk.String()
			lines := strings.Split(errPkStr, "\n")
			for _, line := range lines {
				line = strings.TrimSpace(line)
				if line == "" {
					continue
				}
				if !strings.Contains(line, "has no plug named") && !strings.Contains(line, "has no plug or slot") {
					hasHardError = true
				}
			}
		}
		anyAttempted = true
	}

	if anyAttempted && !hasHardError {
		return true
	}
	return !hasHardError
}
