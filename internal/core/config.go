package core

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// getConfigPath returns the path to the native apps JSON config
func getConfigPath() string {
	configDir, _ := os.UserConfigDir()
	fencdDir := filepath.Join(configDir, "fencd")
	os.MkdirAll(fencdDir, 0755)
	return filepath.Join(fencdDir, "native_apps.json")
}

// readNativeConfig reads the config file and returns the native apps
func readNativeConfig() []AppModel {
	path := getConfigPath()
	data, err := os.ReadFile(path)
	if err != nil {
		return []AppModel{}
	}
	var apps []AppModel
	json.Unmarshal(data, &apps)
	return apps
}

// writeNativeConfig writes the native apps to the config file
func writeNativeConfig(apps []AppModel) error {
	path := getConfigPath()
	data, err := json.MarshalIndent(apps, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}
