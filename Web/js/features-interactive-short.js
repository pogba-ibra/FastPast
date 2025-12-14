// Interactive Features Demo
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const modal = document.getElementById('demo-modal');
    const demoContainer = document.getElementById('demo-container');
    const closeModal = document.querySelector('.close-modal');
    const interactiveCards = document.querySelectorAll('.interactive-card');

    // Add click event to each feature card
    interactiveCards.forEach(card => {
        card.addEventListener('click', () => {
            const feature = card.getAttribute('data-feature');
            openDemo(feature);
        });
    });

    // Close modal when clicking close button
    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
        // Clean up demo content and clear intervals
        demoContainer.innerHTML = '';
        if (demoContainer.moveCursorInterval) clearInterval(demoContainer.moveCursorInterval);
        if (demoContainer.updateProgressInterval) clearInterval(demoContainer.updateProgressInterval);
    });

    // Close modal when clicking outside of modal content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            // Clean up demo content and clear intervals
            demoContainer.innerHTML = '';
            if (demoContainer.moveCursorInterval) clearInterval(demoContainer.moveCursorInterval);
            if (demoContainer.updateProgressInterval) clearInterval(demoContainer.updateProgressInterval);
        }
    });

    // Open demo based on feature type
    function openDemo(feature) {
        modal.classList.add('active');

        switch (feature) {
            case 'video-editing':
                loadVideoEditingDemo();
                break;
            case 'batch-download':
                loadBatchDownloadDemo();
                break;
            case 'ai-summarization':
                loadAISummarizationDemo();
                break;
            case 'format-conversion':
                loadFormatConversionDemo();
                break;
            case 'audio-extraction':
                loadAudioExtractionDemo();
                break;
            case 'cloud-storage':
                loadCloudStorageDemo();
                break;
            default:
                demoContainer.innerHTML = '<p>Demo not available</p>';
        }
    }

    // Load Video Editing Demo
    function loadVideoEditingDemo() {
        demoContainer.innerHTML = `
            <h2>Video Editing Demo</h2>
            <div class="video-editing-demo">
                <div class="video-preview">
                    <img src="https://picsum.photos/seed/video/800/400.jpg" alt="Video preview">
                </div>
                <div class="timeline">
                    <div class="timeline-track">
                        <div class="timeline-segment" style="width: 25%;"></div>
                        <div class="timeline-segment active" style="width: 50%;"></div>
                        <div class="timeline-segment" style="width: 25%;"></div>
                    </div>
                    <div class="timeline-cursor" style="left: 25%;"></div>
                </div>
                <div class="trim-controls">
                    <button class="trim-button" id="start-trim">Set Start Point</button>
                    <button class="trim-button" id="end-trim">Set End Point</button>
                    <button class="trim-button" id="apply-trim">Apply Trim</button>
                </div>
                <p>Click buttons to see how our video trimming tool works. The timeline shows your video segments, and you can select portion you want to keep.</p>
            </div>
        `;

        // Add interactivity to demo
        const startTrimBtn = document.getElementById('start-trim');
        const endTrimBtn = document.getElementById('end-trim');
        const applyTrimBtn = document.getElementById('apply-trim');
        const timelineCursor = document.querySelector('.timeline-cursor');
        let startPoint = 25;
        let endPoint = 75;

        startTrimBtn.addEventListener('click', () => {
            startPoint = parseInt(timelineCursor.style.left);
            updateTimeline();
        });

        endTrimBtn.addEventListener('click', () => {
            endPoint = parseInt(timelineCursor.style.left);
            updateTimeline();
        });

        applyTrimBtn.addEventListener('click', () => {
            // Animate trim
            const segments = document.querySelectorAll('.timeline-segment');
            segments.forEach((segment, index) => {
                if (index === 1) {
                    segment.style.width = `${endPoint - startPoint}%`;
                    segment.style.marginLeft = `${startPoint}%`;
                } else {
                    segment.style.width = '0%';
                }
            });

            // Show success message
            const message = document.createElement('p');
            message.textContent = 'Trim applied successfully! Your video has been edited.';
            message.style.color = '#28a745';
            message.style.marginTop = '20px';
            message.style.fontWeight = '600';
            document.querySelector('.video-editing-demo').appendChild(message);

            // Reset after 3 seconds
            setTimeout(() => {
                message.remove();
                resetTimeline();
            }, 3000);
        });

        // Animate timeline cursor
        let cursorPosition = 0;
        demoContainer.moveCursorInterval = setInterval(() => {
            cursorPosition = (cursorPosition + 1) % 100;
            timelineCursor.style.left = `${cursorPosition}%`;
        }, 50);

        function updateTimeline() {
            const segments = document.querySelectorAll('.timeline-segment');
            segments[1].style.marginLeft = `${startPoint}%`;
            segments[1].style.width = `${endPoint - startPoint}%`;
        }

        function resetTimeline() {
            const segments = document.querySelectorAll('.timeline-segment');
            segments[0].style.width = '25%';
            segments[1].style.width = '50%';
            segments[1].style.marginLeft = '25%';
            segments[2].style.width = '25%';
            startPoint = 25;
            endPoint = 75;
        }
    }

    // Load Batch Download Demo
    function loadBatchDownloadDemo() {
        demoContainer.innerHTML = `
            <h2>Batch Download Demo</h2>
            <div class="batch-download-demo">
                <div class="download-queue" id="download-queue">
                    <div class="queue-item">
                        <div class="item-thumbnail">
                            <img src="https://picsum.photos/seed/video1/120/80.jpg" alt="Video thumbnail">
                        </div>
                        <div class="item-info">
                            <div class="item-title">Video Tutorial Part 1</div>
                            <div class="item-details">YouTube • 12:34 • 1080p</div>
                        </div>
                        <div class="item-progress">
                            <div class="progress-bar" style="background-color: #4facfe;"></div>
                        </div>
                        <div class="item-status">Downloading</div>
                    </div>
                    <div class="queue-item">
                        <div class="item-thumbnail">
                            <img src="https://picsum.photos/seed/video2/120/80.jpg" alt="Video thumbnail">
                        </div>
                        <div class="item-info">
                            <div class="item-title">Video Tutorial Part 2</div>
                            <div class="item-details">YouTube • 15:21 • 720p</div>
                        </div>
                        <div class="item-progress">
                            <div class="progress-bar" style="background-color: #ff6b6b;"></div>
                        </div>
                        <div class="item-status">Waiting</div>
                    </div>
                    <div class="queue-item">
                        <div class="item-thumbnail">
                            <img src="https://picsum.photos/seed/video3/120/80.jpg" alt="Video thumbnail">
                        </div>
                        <div class="item-info">
                            <div class="item-title">Video Tutorial Part 3</div>
                            <div class="item-details">YouTube • 18:45 • 1080p</div>
                        </div>
                        <div class="item-progress">
                            <div class="progress-bar" style="background-color: #ff6b6b;"></div>
                        </div>
                        <div class="item-status">Waiting</div>
                    </div>
                </div>
                <button class="add-button" id="add-video">+ Add Another Video</button>
                <p>Watch as our batch downloader processes multiple videos simultaneously. Each video has its own progress bar with a unique color.</p>
            </div>
        `;

        // Add interactivity to demo
        const addVideoBtn = document.getElementById('add-video');
        const progressBars = document.querySelectorAll('.progress-bar');
        const statusElements = document.querySelectorAll('.item-status');

        // Animate progress bars
        demoContainer.updateProgressInterval = setInterval(() => {
            progressBars.forEach((bar, index) => {
                if (statusElements[index].textContent === 'Downloading') {
                    const currentProgress = parseInt(bar.style.width) || 0;
                    if (currentProgress < 100) {
                        bar.style.width = `${currentProgress + 2}%`;
                    } else {
                        statusElements[index].textContent = 'Completed';
                        statusElements[index].style.color = '#28a745';

                        // Start next download if available
                        if (index < progressBars.length - 1) {
                            progressBars[index + 1].style.backgroundColor = '#4facfe';
                            statusElements[index + 1].textContent = 'Downloading';
                        }
                    }
                }
            });
        }, 100);

        // Add new video when button is clicked
        let videoCount = 4;
        addVideoBtn.addEventListener('click', () => {
            const newItem = document.createElement('div');
            newItem.className = 'queue-item';
            newItem.innerHTML = `
                <div class="item-thumbnail">
                    <img src="https://picsum.photos/seed/video${videoCount}/120/80.jpg" alt="Video thumbnail">
                </div>
                <div class="item-info">
                    <div class="item-title">Video Tutorial Part ${videoCount}</div>
                    <div class="item-details">YouTube • 10:${10 + videoCount} • 720p</div>
                </div>
                <div class="item-progress">
                    <div class="progress-bar" style="background-color: #ff6b6b;"></div>
                </div>
                <div class="item-status">Waiting</div>
            `;
            document.getElementById('download-queue').appendChild(newItem);
            videoCount++;

            // Show success message
            const message = document.createElement('p');
            message.textContent = 'Video added to queue!';
            message.style.color = '#28a745';
            message.style.marginTop = '10px';
            message.style.fontWeight = '600';
            document.querySelector('.batch-download-demo').appendChild(message);

            // Remove message after 2 seconds
            setTimeout(() => message.remove(), 2000);
        });
    }

    // Load AI Summarization Demo
    function loadAISummarizationDemo() {
        demoContainer.innerHTML = `
            <h2>AI Summarization Demo</h2>
            <div class="ai-summarization-demo">
                <div class="video-input">
                    <img src="https://picsum.photos/seed/aivideo/160/120.jpg" alt="Video thumbnail">
                    <div class="video-input-info">
                        <div class="video-input-title">Introduction to Machine Learning</div>
                        <div class="video-input-details">YouTube • 45:20 • 1080p</div>
                    </div>
                    <button class="summarize-button" id="summarize-btn">Generate Summary</button>
                </div>
                <p>Click the button to see how our AI analyzes and summarizes video content, extracting key points and creating transcripts.</p>
            </div>
        `;

        // Add interactivity to demo
        const summarizeBtn = document.getElementById('summarize-btn');

        summarizeBtn.addEventListener('click', () => {
            // Show loading state
            summarizeBtn.textContent = 'Analyzing...';
            summarizeBtn.disabled = true;

            // Simulate AI processing
            setTimeout(() => {
                // Add AI output
                const aiOutput = document.createElement('div');
                aiOutput.className = 'ai-output';
                aiOutput.innerHTML = `
                    <div class="ai-output-title">AI Analysis Complete</div>
                    <div class="key-points">
                        <div class="key-point">
                            <div class="key-point-marker">•</div>
                            <div class="key-point-text">Machine learning is a subset of artificial intelligence that enables computers to learn without explicit programming</div>
                        </div>
                        <div class="key-point">
                            <div class="key-point-marker">•</div>
                            <div class="key-point-text">The video covers three main types: supervised learning, unsupervised learning, and reinforcement learning</div>
                        </div>
                        <div class="key-point">
                            <div class="key-point-marker">•</div>
                            <div class="key-point-text">Practical applications include image recognition, natural language processing, and recommendation systems</div>
                        </div>
                    </div>
                    <div class="transcript">
                        <div class="transcript-title">Partial Transcript</div>
                        <div class="transcript-text">
                            "Welcome to this introduction to machine learning. In this video, we'll explore the fundamental concepts that power today's AI applications. Machine learning allows systems to learn and improve from experience without being explicitly programmed..."
                        </div>
                    </div>
                `;

                document.querySelector('.ai-summarization-demo').appendChild(aiOutput);

                // Reset button
                summarizeBtn.textContent = 'Generate Summary';
                summarizeBtn.disabled = false;
            }, 2000);
        });
    }

    // Load Format Conversion Demo
    function loadFormatConversionDemo() {
        demoContainer.innerHTML = `
            <h2>Format Conversion Demo</h2>
            <div class="format-conversion-demo">
                <div class="converter-interface">
                    <div class="file-input-area" id="file-input">
                        <div class="file-input-icon"><i class="fas fa-cloud-upload-alt"></i></div>
                        <div class="file-input-text">Drag and drop a video file here or click to browse</div>
                        <button class="browse-button">Browse Files</button>
                    </div>
                    <div class="conversion-options">
                        <select class="format-select">
                            <option value="mp4">MP4</option>
                            <option value="avi">AVI</option>
                            <option value="mov">MOV</option>
                            <option value="webm">WebM</option>
                        </select>
                        <select class="quality-select">
                            <option value="1080p">1080p</option>
                            <option value="720p">720p</option>
                            <option value="480p">480p</option>
                            <option value="360p">360p</option>
                        </select>
                    </div>
                    <button class="convert-button" id="convert-btn">Convert Video</button>
                </div>
                <p>Try our format converter by selecting a file and choosing your desired output format and quality.</p>
            </div>
        `;

        // Add interactivity to demo
        const fileInput = document.getElementById('file-input');
        const convertBtn = document.getElementById('convert-btn');
        const formatSelect = document.querySelector('.format-select');
        const qualitySelect = document.querySelector('.quality-select');

        fileInput.addEventListener('click', () => {
            fileInput.classList.add('active');

            // Simulate file selection
            setTimeout(() => {
                fileInput.innerHTML = `
                    <div class="file-selected">
                        <div class="file-selected-icon"><i class="fas fa-file-video"></i></div>
                        <div class="file-selected-info">
                            <div class="file-selected-name">sample_video.mp4</div>
                            <div class="file-selected-details">125 MB • 1920x1080 • 00:12:34</div>
                        </div>
                    </div>
                `;
            }, 500);
        });

        convertBtn.addEventListener('click', () => {
            // Show loading state
            convertBtn.textContent = 'Converting...';
            convertBtn.disabled = true;

            // Simulate conversion process
            setTimeout(() => {
                // Show conversion result
                const conversionPreview = document.createElement('div');
                conversionPreview.className = 'conversion-preview';
                conversionPreview.innerHTML = `
                    <div class="preview-file">
                        <div class="preview-file-icon"><i class="fas fa-file-video"></i></div>
                        <div class="preview-file-name">sample_video.mp4</div>
                        <div class="preview-file-details">125 MB • 1920x1080</div>
                    </div>
                    <div class="conversion-arrow"><i class="fas fa-arrow-right"></i></div>
                    <div class="preview-file">
                        <div class="preview-file-icon"><i class="fas fa-file-video"></i></div>
                        <div class="preview-file-name">sample_video.${formatSelect.value}</div>
                        <div class="preview-file-details">95 MB • ${qualitySelect.value}</div>
                    </div>
                `;

                document.querySelector('.converter-interface').appendChild(conversionPreview);

                // Reset button
                convertBtn.textContent = 'Convert Another Video';
                convertBtn.disabled = false;
            }, 2000);
        });
    }

    // Load Audio Extraction Demo
    function loadAudioExtractionDemo() {
        demoContainer.innerHTML = `
            <h2>Audio Extraction Demo</h2>
            <div class="audio-extraction-demo">
                <div class="extraction-interface">
                    <div class="video-preview-audio">
                        <img src="https://picsum.photos/seed/audio/800/450.jpg" alt="Video preview">
                    </div>
                    <div class="extraction-options">
                        <select class="format-select-audio">
                            <option value="mp3">MP3</option>
                            <option value="wav">WAV</option>
                            <option value="flac">FLAC</option>
                            <option value="aac">AAC</option>
                        </select>
                        <select class="quality-select-audio">
                            <option value="320">320 kbps</option>
                            <option value="256">256 kbps</option>
                            <option value="192">192 kbps</option>
                            <option value="128">128 kbps</option>
                        </select>
                    </div>
                    <button class="extract-button" id="extract-btn">Extract Audio</button>
                    <div class="audio-waveform" id="waveform">
                        <div class="waveform-bars">
                            <!-- Waveform bars will be generated by JavaScript -->
                        </div>
                    </div>
                </div>
                <p>Extract audio from videos with our easy-to-use tool. Choose your preferred format and quality, then click extract.</p>
            </div>
        `;

        // Generate waveform bars
        const waveformBars = document.querySelector('.waveform-bars');
        for (let i = 0; i < 50; i++) {
            const bar = document.createElement('div');
            bar.className = 'waveform-bar';
            bar.style.height = `${Math.random() * 60 + 20}%`;
            waveformBars.appendChild(bar);
        }

        // Add interactivity to demo
        const extractBtn = document.getElementById('extract-btn');
        const formatSelect = document.querySelector('.format-select-audio');
        const qualitySelect = document.querySelector('.quality-select-audio');

        extractBtn.addEventListener('click', () => {
            // Show loading state
            extractBtn.textContent = 'Extracting...';
            extractBtn.disabled = true;

            // Animate waveform bars
            const bars = document.querySelectorAll('.waveform-bar');
            bars.forEach(bar => {
                // const originalHeight = bar.style.height; // Unused
                bar.style.animation = 'pulse 0.5s infinite alternate';
            });

            // Simulate extraction process
            setTimeout(() => {
                // Stop animation
                bars.forEach(bar => {
                    bar.style.animation = '';
                });

                // Show success message
                const message = document.createElement('p');
                message.textContent = `Audio extracted successfully as audio.${formatSelect.value} at ${qualitySelect.value} kbps!`;
                message.style.color = '#28a745';
                message.style.marginTop = '20px';
                message.style.fontWeight = '600';
                document.querySelector('.audio-extraction-demo').appendChild(message);

                // Reset button
                extractBtn.textContent = 'Extract Another Audio';
                extractBtn.disabled = false;

                // Remove message after 3 seconds
                setTimeout(() => message.remove(), 3000);
            }, 2000);
        });
    }

    // Load Cloud Storage Demo
    function loadCloudStorageDemo() {
        demoContainer.innerHTML = `
            <h2>Cloud Storage Demo</h2>
            <div class="cloud-storage-demo">
                <div class="cloud-interface">
                    <div class="cloud-providers">
                        <div class="cloud-provider active" data-provider="google-drive">
                            <div class="cloud-provider-icon"><i class="fab fa-google-drive"></i></div>
                            <div class="cloud-provider-name">Google Drive</div>
                        </div>
                        <div class="cloud-provider" data-provider="dropbox">
                            <div class="cloud-provider-icon"><i class="fab fa-dropbox"></i></div>
                            <div class="cloud-provider-name">Dropbox</div>
                        </div>
                        <div class="cloud-provider" data-provider="onedrive">
                            <div class="cloud-provider-icon"><i class="fab fa-microsoft"></i></div>
                            <div class="cloud-provider-name">OneDrive</div>
                        </div>
                    </div>
                    <button class="cloud-storage-button" id="sync-btn">Sync to Cloud</button>
                    <div class="storage-status">
                        <div class="status-title">Storage Status</div>
                        <div class="storage-bar">
                            <div class="storage-used" id="storage-bar"></div>
                        </div>
                        <div class="storage-details">
                            <span id="storage-used">2.3 GB</span> of <span>15 GB</span> used
                        </div>
                    </div>
                    <div class="file-list">
                        <div class="file-item">
                            <div class="file-icon"><i class="fas fa-file-video"></i></div>
                            <div class="file-name">Tutorial_Part1.mp4</div>
                            <div class="file-size">125 MB</div>
                        </div>
                        <div class="file-item">
                            <div class="file-icon"><i class="fas fa-file-video"></i></div>
                            <div class="file-name">Tutorial_Part2.mp4</div>
                            <div class="file-size">98 MB</div>
                        </div>
                        <div class="file-item">
                            <div class="file-icon"><i class="fas fa-file-audio"></i></div>
                            <div class="file-name">Podcast_Episode.mp3</div>
                            <div class="file-size">42 MB</div>
                        </div>
                    </div>
                </div>
                <p>Connect to your favorite cloud storage service and sync your downloaded content with just one click.</p>
            </div>
        `;

        // Add interactivity to demo
        const cloudProviders = document.querySelectorAll('.cloud-provider');
        const syncBtn = document.getElementById('sync-btn');
        const storageBar = document.getElementById('storage-bar');
        const storageUsed = document.getElementById('storage-used');

        // Handle cloud provider selection
        cloudProviders.forEach(provider => {
            provider.addEventListener('click', () => {
                cloudProviders.forEach(p => p.classList.remove('active'));
                provider.classList.add('active');
            });
        });

        // Handle sync button click
        syncBtn.addEventListener('click', () => {
            // Show loading state
            syncBtn.textContent = 'Syncing...';
            syncBtn.disabled = true;

            // Animate storage bar
            let currentWidth = 15;
            const targetWidth = 35;
            const updateStorage = setInterval(() => {
                if (currentWidth < targetWidth) {
                    currentWidth += 1;
                    storageBar.style.width = `${currentWidth}%`;

                    // Update storage used text
                    const gbUsed = (currentWidth * 15 / 100).toFixed(1);
                    storageUsed.textContent = `${gbUsed} GB`;
                } else {
                    clearInterval(updateStorage);

                    // Show success message
                    const message = document.createElement('p');
                    message.textContent = 'Files synced successfully!';
                    message.style.color = '#28a745';
                    message.style.marginTop = '20px';
                    message.style.fontWeight = '600';
                    document.querySelector('.cloud-storage-demo').appendChild(message);

                    // Reset button
                    syncBtn.textContent = 'Sync More Files';
                    syncBtn.disabled = false;

                    // Remove message after 3 seconds
                    setTimeout(() => message.remove(), 3000);
                }
            }, 30);
        });
    }
});
