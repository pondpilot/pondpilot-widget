# PondPilot Widget - minimal development commands
# https://github.com/casey/just

default:
    @just --list

# Common aliases
alias b := build
alias d := dev
alias f := format
alias fc := format-check
alias t := test

# Install project dependencies
install:
    npm install

# Build distributable bundles
build:
    npm run build

# Start the local development server
dev:
    npm run dev

# Run the unit test suite
test:
    npm test

# Format code with Prettier
format:
    npm run format

# Check formatting without writing changes
format-check:
    npm run format:check

# Remove build artifacts
clean:
    rm -rf dist/
