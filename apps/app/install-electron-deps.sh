#!/bin/bash

# This script installs the required dependencies for the Electron app
echo "Installing Electron dependencies..."

# Make sure we're in the correct directory
cd "$(dirname "$0")"

# Install Electron and electron-builder
echo "Installing electron and electron-builder..."
pnpm add electron@latest electron-builder@latest concurrently@latest -D

# Check if the installation was successful
if [ $? -eq 0 ]; then
  echo "Successfully installed Electron dependencies!"
  echo "You can now run 'pnpm dev' to start the application in development mode."
else
  echo "Failed to install dependencies. Please make sure you have Node.js v18.18.0 or later installed."
  echo "Current Node.js version: $(node --version)"
  echo "Required Node.js version: ^18.18.0 || ^20.9.0 || >=21.1.0"
fi