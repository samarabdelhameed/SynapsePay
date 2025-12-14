#!/bin/bash

# SynapsePay - Stop All Services Script
# Usage: ./stop-all.sh

echo "🛑 Stopping SynapsePay Services..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to stop a service
stop_service() {
    local name=$1
    
    if [ -f "/tmp/${name}.pid" ]; then
        local pid=$(cat /tmp/${name}.pid)
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid 2>/dev/null
            echo -e "${RED}✓ Stopped $name (PID: $pid)${NC}"
        else
            echo -e "${GREEN}  $name was not running${NC}"
        fi
        rm -f /tmp/${name}.pid
    else
        echo -e "${GREEN}  $name PID file not found${NC}"
    fi
}

# Stop all services
stop_service "frontend"
stop_service "facilitator"
stop_service "resource-server"
stop_service "actions-api"

echo ""
echo -e "${GREEN}All services stopped.${NC}"
