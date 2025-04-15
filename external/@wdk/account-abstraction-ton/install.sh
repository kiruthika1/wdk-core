#!/bin/bash

set -e  # Exit on error

# 👇 Edit the order of packages here
ORDERED_PACKAGES=(
  "ui-config"
  "ui-core"
  "ui-ton"
  "ui-tron"
  "ui-evm"
  "ui-aptos"
  "ui-solana"
  "ui-bridge-sdk"
  "ui-bridge-oft"
)

# Determine the base directory
if [ -d "./packages" ]; then
  BASE_DIR="./packages"
elif [ -d "../../packages" ]; then
  BASE_DIR="../../packages"
else
  echo "❌ Could not find packages directory"
  exit 1
fi

for package in "${ORDERED_PACKAGES[@]}"; do
  dir="$BASE_DIR/$package"
  if [ -d "$dir" ]; then
    echo "🔧 Processing $package"
    (
      cd "$dir"
      echo "🧹 Cleaning..."
      yarn clean || echo "⚠️  No clean script in $package"

      echo "📦 Installing dependencies..."
      yarn

      echo "🏗️  Building..."
      yarn build
    )
    echo "✅ Done with $package"
    echo "-----------------------------"
  else
    echo "❌ Directory $dir does not exist. Skipping..."
  fi
done

echo "🎉 All specified packages processed successfully!"
