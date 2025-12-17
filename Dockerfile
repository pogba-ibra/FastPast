FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    aria2 \
    xz-utils \
    ca-certificates \
    build-essential \
    libffi-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s $(which node) /usr/local/bin/node || true

# Install yt-dlp regarding PEP 668 (Nightly Release via pip) and Impersonation Deps
# Use @nightly to get the absolute latest version with Facebook parser fixes
RUN pip3 install --upgrade "yt-dlp[default,curl-cffi]@https://github.com/yt-dlp/yt-dlp/archive/master.tar.gz" pyopenssl requests brotli certifi --break-system-packages

# Install yt-dlp Nightly Build (Standalone Binary) for YouTube
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN curl -L https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp-nightly && \
    chmod a+rx /usr/local/bin/yt-dlp-nightly

# Install Static FFmpeg Build (Optimized for yt-dlp)
# Solves "Muxing" issues with Facebook DASH streams
RUN mkdir -p /usr/src/app/bin && \
    curl -L https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz -o ffmpeg.tar.xz && \
    tar -xvf ffmpeg.tar.xz && \
    cp ffmpeg-master-latest-linux64-gpl/bin/ffmpeg /usr/src/app/bin/ && \
    cp ffmpeg-master-latest-linux64-gpl/bin/ffprobe /usr/src/app/bin/ && \
    rm -rf ffmpeg.tar.xz ffmpeg-master-latest-linux64-gpl && \
    chmod +x /usr/src/app/bin/ffmpeg /usr/src/app/bin/ffprobe

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Playwright browsers (Chromium only for Facebook automation)
# This is placed after npm install to ensure playwright package is available
RUN npx playwright install --with-deps chromium

# Install Deno (Supported JS Runtime for yt-dlp)
RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://deno.land/install.sh | sh && \
    mv /root/.deno/bin/deno /usr/local/bin/deno && \
    chmod 755 /usr/local/bin/deno && \
    rm -rf /root/.deno
# No need to modify PATH as /usr/local/bin is already in PATH

# Copy app source
COPY . .

# Fix permissions for cookie files (Ensure readability)
RUN chmod 644 *.txt || true

# Install pm2 globally
RUN npm install pm2 -g

# Expose port
EXPOSE 8000

# Optional: Set Proxy for yt-dlp to bypass blocking (e.g. http://user:pass@host:port)
# ENV PROXY_URL=""

# Start command using pm2-runtime (Docker-ready process manager)
CMD [ "pm2-runtime", "server.js" ]
