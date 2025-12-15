FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp regarding PEP 668 (Stable Version)
RUN pip3 install yt-dlp --break-system-packages

# Install yt-dlp Nightly Build (Standalone Binary) for YouTube
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN curl -L https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp-nightly && \
    chmod a+rx /usr/local/bin/yt-dlp-nightly

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Install pm2 globally
RUN npm install pm2 -g

# Expose port
EXPOSE 8000

# Start command using pm2-runtime (Docker-ready process manager)
CMD [ "pm2-runtime", "server.js" ]
