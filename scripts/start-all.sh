#!/bin/bash

# SynapsePay - Start All Services Script
# Usage: ./start-all.sh

echo "🚀 Starting SynapsePay Services..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to start a service
start_service() {
    local name=$1
    local dir=$2
    local port=$3
    local cmd=$4
    
    echo -e "${BLUE}Starting $name on port $port...${NC}"
    cd "$dir"
    $cmd > /tmp/${name}.log 2>&1 &
    echo $! > /tmp/${name}.pid
    echo -e "${GREEN}✓ $name started (PID: $(cat /tmp/${name}.pid))${NC}"
    cd - > /dev/null
}

# Get the script directory (project root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${YELLOW}Project Directory: $SCRIPT_DIR${NC}"
echo ""

# Check if FACILITATOR_PRIVATE_KEY is set
if [ -z "$FACILITATOR_PRIVATE_KEY" ]; then
    echo -e "${YELLOW}⚠️  Warning: FACILITATOR_PRIVATE_KEY not set${NC}"
    echo "   The facilitator will run in demo mode"
    echo ""
fi

# Start services
start_service "frontend" "$SCRIPT_DIR/apps/web" "5173" "npm run dev"
sleep 2

start_service "facilitator" "$SCRIPT_DIR/apps/x402-facilitator" "4021" "npm run dev"
sleep 2

start_service "resource-server" "$SCRIPT_DIR/apps/resource-server" "4020" "npm run dev"
sleep 2

start_service "actions-api" "$SCRIPT_DIR/apps/actions-api" "8405" "npm run dev"
sleep 2

echo ""
echo -e "${GREEN}🎉 All services started!${NC}"
echo ""
echo "Service URLs:"
echo "  • Frontend:        http://localhost:5173"
echo "  • X402 Facilitator: http://localhost:4021"
echo "  • Resource Server:  http://localhost:4020"
echo "  • Actions API:      http://localhost:8405"
echo ""
echo "Health Checks:"
echo "  curl http://localhost:4021/health"
echo "  curl http://localhost:4020/health"
echo "  curl http://localhost:8405/health"
echo ""
echo "To stop all services: ./stop-all.sh"
echo ""
echo -e "${YELLOW}📹 Ready to record demo video!${NC}"
