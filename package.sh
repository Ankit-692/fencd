#!/bin/bash
set -e

echo "Building Wails application..."
# Note: You can add -clean to perform a clean build if desired.
wails build -platform linux/amd64 -tags webkit2_41

echo "Checking for nFPM..."
if ! command -v nfpm &> /dev/null; then
    echo "nfpm not found. Installing via 'go install'..."
    go install github.com/goreleaser/nfpm/v2/cmd/nfpm@latest
    # Ensure GOPATH/bin is in PATH for the remainder of this script
    export PATH=$PATH:$(go env GOPATH)/bin
fi

echo "Generating .deb package..."
nfpm pkg --packager deb --target build/fencd_0.1.0_amd64.deb

echo "Generating .rpm package..."
nfpm pkg --packager rpm --target build/fencd_0.1.0_amd64.rpm

echo "Done! The generated packages are available in the build/ directory:"
ls -lh build/*.deb build/*.rpm
