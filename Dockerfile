FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    aria2 \
    xz-utils \
    unzip \
    ca-certificates \
    build-essential \
    libffi-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s $(which node) /usr/local/bin/node || true

# Ensure pip is up to date and install required networking libraries
RUN pip3 install --upgrade pip --break-system-packages

# Force absolute latest yt-dlp nightly from master branch
# 1. Uninstall any potential system or pip installations that might shadow the nightly
# 2. Force reinstall from master archive
RUN pip3 uninstall -y yt-dlp || true
RUN pip3 install --no-cache-dir --upgrade --force-reinstall "yt-dlp[default,curl-cffi]@https://github.com/yt-dlp/yt-dlp/archive/master.tar.gz" pyopenssl requests brotli certifi --break-system-packages

# Install yt-dlp Nightly Build (Standalone Binary) as a secondary fallback
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN curl -L https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp-nightly && \
    chmod a+rx /usr/local/bin/yt-dlp-nightly && \
    /usr/local/bin/yt-dlp-nightly --update-to nightly

# Install Static FFmpeg Build (Optimized for yt-dlp)
# Solves "Muxing" issues with Facebook DASH streams
RUN mkdir -p /tmp/ffmpeg && \
    curl -L https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz -o /tmp/ffmpeg/ffmpeg.tar.xz && \
    tar -xvf /tmp/ffmpeg/ffmpeg.tar.xz -C /tmp/ffmpeg && \
    cp /tmp/ffmpeg/ffmpeg-master-latest-linux64-gpl/bin/ffmpeg /usr/local/bin/ && \
    cp /tmp/ffmpeg/ffmpeg-master-latest-linux64-gpl/bin/ffprobe /usr/local/bin/ && \
    rm -rf /tmp/ffmpeg && \
    chmod +x /usr/local/bin/ffmpeg /usr/local/bin/ffprobe

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Deno
RUN curl -fsSL https://deno.land/install.sh | sh
ENV PATH="/root/.deno/bin:$PATH"


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
