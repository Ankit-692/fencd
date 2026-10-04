package models

type Permissions struct {
	Network        bool `json:"network"`
	Camera         bool `json:"camera"`
	Microphone     bool `json:"microphone"`
	Display        bool `json:"display"`
	GPU            bool `json:"gpu"`
	DBus           bool `json:"dbus"`
	FSHome         bool `json:"fsHome"`
	FSHost         bool `json:"fsHost"`
	AudioOutput    bool `json:"audioOutput"`
	Virtualization bool `json:"virtualization"`
}

type AppModel struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Type        string      `json:"type"`
	Icon        string      `json:"icon"`
	Permissions Permissions `json:"permissions"`
}

type SystemApp struct {
	Name     string `json:"name"`
	ExecPath string `json:"execPath"`
	Icon     string `json:"icon"`
}
