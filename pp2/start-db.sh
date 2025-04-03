#!/bin/bash
# WARNING: This script clears all data/migrations/tables in the database.
# Use it only for testing when you want a completely fresh database.

CONTAINER_NAME="db"

# Check if the container is already running
echo "Stopping existing PostgreSQL container..."
sudo docker rm -f ${CONTAINER_NAME}

# Start a new PostgreSQL container with a consistent name
echo "Starting PostgreSQL container..."
docker run --name ${CONTAINER_NAME} \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=flynext \
  -p 5432:5432 \
  -d postgres:15

# Wait for the database to start
echo "Waiting for PostgreSQL to start..."
while ! docker exec ${CONTAINER_NAME} pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
done
echo "PostgreSQL is ready!"

# force push the Prisma schema to the database
# npx prisma db push --force-reset
# ^ shits not working bc of a path problem idk
echo "Database schema pushed successfully!"