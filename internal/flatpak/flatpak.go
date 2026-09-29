package flatpak

import (
	"bytes"
	"os/exec"
	"strings"

	"fencd/internal/models"
	"fencd/internal/utils"
)

// GetApps discovers all flatpaks and their current permissions
func GetApps() []models.AppModel {
	var apps []models.AppModel

	cmd := exec.Command("flatpak", "list", "--app", "--columns=application,name")
	var out bytes.Buffer
	cmd.Stdout = &out
	if err := cmd.Run(); err != nil {
		return apps // return empty if flatpak fails or isn't installed
	}

	lines := strings.Split(out.String(), "\n")
	for _, line := range lines {
		if strings.TrimSpace(line) == "" {
			continue
		}
		parts := strings.Split(line, "\t")
		if len(parts) >= 2 {
			appID := strings.TrimSpace(parts[0])
			appName := strings.TrimSpace(parts[1])

			// Exclude headers if they exist
			if appID == "Application ID" {
				continue
			}

			permissions := getFlatpakPermissions(appID)

			icon := utils.GetSystemIconBase64(appID)
			if icon == "" {
				icon = "📦" // Use a generic box icon for flatpaks fallback
			}

			apps = append(apps, models.AppModel{
				ID:          appID,
				Name:        appName,
				Type:        "Flatpak",
				Icon:        icon,
				Permissions: permissions,
			})
		}
	}
	return apps
}

func getFlatpakPermissions(appID string) models.Permissions {
	cmd := exec.Command("flatpak", "info", "--show-permissions", appID)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Run()

	output := out.String()
	perms := models.Permissions{
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

	lines := strings.Split(output, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "shared=") {
			if strings.Contains(line, "network") {
				perms.Network = true
			}
		} else if strings.HasPrefix(line, "filesystems=") {
			if strings.Contains(line, "home") {
				perms.FSHome = true
			}
			if strings.Contains(line, "host") {
				perms.FSHost = true
			}
		} else if strings.HasPrefix(line, "devices=") {
			if strings.Contains(line, "all") {
				perms.Camera = true // simplifying device access to camera for UI
				perms.Virtualization = true
			}
			if strings.Contains(line, "kvm") {
				perms.Virtualization = true
			}
			if strings.Contains(line, "dri") || strings.Contains(line, "all") {
				perms.GPU = true
			}
		} else if strings.HasPrefix(line, "sockets=") {
			if strings.Contains(line, "pulseaudio") || strings.Contains(line, "pipewire") {
				perms.Microphone = true
				perms.AudioOutput = true
			}
			if strings.Contains(line, "x11") || strings.Contains(line, "fallback-x11") || strings.Contains(line, "wayland") {
				perms.Display = true
			}
			if strings.Contains(line, "session-bus") || strings.Contains(line, "system-bus") {
				perms.DBus = true
			}
		}
	}
	return perms
}

func TogglePermission(appID string, permission string, enable bool) bool {
	var flags []string

	switch permission {
	case "network":
		if enable {
			flags = append(flags, "--share=network")
		} else {
			flags = append(flags, "--unshare=network")
		}
	case "fshome":
		if enable {
			flags = append(flags, "--filesystem=home")
		} else {
			flags = append(flags, "--nofilesystem=home")
		}
	case "fshost":
		if enable {
			flags = append(flags, "--filesystem=host")
		} else {
			flags = append(flags, "--nofilesystem=host")
		}
	case "audiooutput":
		if enable {
			flags = append(flags, "--socket=pulseaudio")
		} else {
			flags = append(flags, "--nosocket=pulseaudio")
		}
	case "virtualization":
		if enable {
			flags = append(flags, "--device=kvm")
		} else {
			flags = append(flags, "--nodevice=kvm")
		}
	case "camera":
		if enable {
			flags = append(flags, "--device=all")
		} else {
			flags = append(flags, "--nodevice=all")
		}
	case "microphone":
		if enable {
			flags = append(flags, "--socket=pulseaudio")
		} else {
			flags = append(flags, "--nosocket=pulseaudio")
		}
	case "display":
		if enable {
			flags = append(flags, "--socket=x11", "--socket=wayland", "--socket=fallback-x11")
		} else {
			flags = append(flags, "--nosocket=x11", "--nosocket=wayland", "--nosocket=fallback-x11")
		}
	case "gpu":
		if enable {
			flags = append(flags, "--device=dri")
		} else {
			flags = append(flags, "--nodevice=dri")
		}
	case "dbus":
		if enable {
			flags = append(flags, "--socket=session-bus", "--socket=system-bus")
		} else {
			flags = append(flags, "--nosocket=session-bus", "--nosocket=system-bus")
		}
	default:
		return false
	}

	args := []string{"override", "--user"}
	args = append(args, flags...)
	args = append(args, appID)

	cmd := exec.Command("flatpak", args...)
	if err := cmd.Run(); err != nil {
		return false
	}
	return true
}
