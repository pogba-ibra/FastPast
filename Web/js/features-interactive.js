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

    // Close modal when clicking the close button
    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
        // Clean up demo content
        demoContainer.innerHTML = '';
    });

    // Close modal when clicking outside the modal content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            // Clean up demo content
            demoContainer.innerHTML = '';
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
                <p>Click the buttons to see how our video trimming tool works. The timeline shows your video segments, and you can select the portion you want to keep.</p>
            </div>
        `;

        // Add interactivity to the demo
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
            // Animate the trim
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
        const moveCursor = setInterval(() => {
            cursorPosition = (cursorPosition + 1) % 100;
            timelineCursor.style.left = `${cursorPosition}%`;
        }, 50);

        // Store interval ID for cleanup
        demoContainer.moveCursorInterval = moveCursor;

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

        // Add interactivity to the demo
        const addVideoBtn = document.getElementById('add-video');
        const downloadQueue = document.getElementById('download-queue');
        const progressBars = document.querySelectorAll('.progress-bar');
        const statusElements = document.querySelectorAll('.item-status');

        // Animate progress bars
        // let progress = 0; // Unused
        const updateProgress = setInterval(() => {
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

        // Store interval ID for cleanup
        demoContainer.updateProgressInterval = updateProgress;

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
            downloadQueue.appendChild(newItem);
            videoCount++;

            // Show success message
            const message = document.createElement('p');
            message.textContent = 'Video added to queue!';
            message.style.color = '#28a745';
            message.style.marginTop = '10px';
            message.style.fontWeight = '600';
            document.querySelector('.batch-download-demo').appendChild(message);

            // Remove message after 2 seconds
            setTimeout(() => {
                message.remove();
            }, 2000);
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
                        <div class="video-input-details">YouTube • 45:30 • Educational</div>
                    </div>
                    <button class="summarize-button" id="summarize-btn">Generate Summary</button>
                </div>
                <div class="ai-output" id="ai-output" style="display: none;">
                    <div class="ai-output-title">AI-Generated Summary</div>
                    <div class="key-points">
                        <div class="key-point">
                            <span class="key-point-marker">•</span>
                            <span class="key-point-text">Machine learning is a subset of artificial intelligence that enables systems to learn from data</span>
                        </div>
                        <div class="key-point">
                            <span class="key-point-marker">•</span>
                            <span class="key-point-text">Three main types: supervised learning, unsupervised learning, and reinforcement learning</span>
                        </div>
                        <div class="key-point">
                            <span class="key-point-marker">•</span>
                            <span class="key-point-text">Applications include image recognition, natural language processing, and predictive analytics</span>
                        </div>
                    </div>
                    <div class="transcript">
                        <div class="transcript-title">Partial Transcript</div>
                        <div class="transcript-text" id="transcript-text"></div>
                    </div>
                </div>
                <p>Our AI analyzes video content to generate concise summaries and transcripts. Click the button to see it in action.</p>
            </div>
        `;

        // Add interactivity to the demo
        const summarizeBtn = document.getElementById('summarize-btn');
        const aiOutput = document.getElementById('ai-output');
        const transcriptText = document.getElementById('transcript-text');

        summarizeBtn.addEventListener('click', () => {
            // Show loading state
            summarizeBtn.textContent = 'Analyzing...';
            summarizeBtn.disabled = true;

            // Simulate AI processing
            setTimeout(() => {
                // Show AI output
                aiOutput.style.display = 'block';

                // Animate transcript text
                const transcript = "In this comprehensive introduction to machine learning, we explore the fundamental concepts that power today's most innovative technologies. Machine learning represents a paradigm shift in how we approach problem-solving with computers. Rather than explicitly programming every rule, we enable systems to learn patterns from data... The field has evolved dramatically since its inception in the 1950s, with recent breakthroughs in deep learning revolutionizing what's possible. Today, machine learning powers everything from recommendation systems to autonomous vehicles, making it one of the most transformative technologies of our time.";

                let index = 0;
                transcriptText.textContent = '';

                const typeWriter = setInterval(() => {
                    if (index < transcript.length) {
                        transcriptText.textContent += transcript.charAt(index);
                        index++;
                    } else {
                        clearInterval(typeWriter);
                    }
                }, 20);

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
                    <div class="file-input-area" id="file-input-area">
                        <div class="file-input-icon">
                            <i class="fas fa-cloud-upload-alt"></i>
                        </div>
                        <div class="file-input-text">Drag and drop your video file here or</div>
                        <button class="browse-button" id="browse-btn">Browse Files</button>
                    </div>
                    <div class="conversion-options">
                        <select class="format-select" id="format-select">
                            <option value="mp4">MP4</option>
                            <option value="avi">AVI</option>
                            <option value="mov">MOV</option>
                            <option value="webm">WebM</option>
                            <option value="mkv">MKV</option>
                        </select>
                        <select class="quality-select" id="quality-select">
                            <option value="4k">4K (2160p)</option>
                            <option value="1080p">Full HD (1080p)</option>
                            <option value="720p">HD (720p)</option>
                            <option value="480p">SD (480p)</option>
                        </select>
                    </div>
                    <button class="convert-button" id="convert-btn" disabled>Convert File</button>
                </div>
                <div class="conversion-preview" id="conversion-preview" style="display: none;">
                    <div class="preview-file">
                        <div class="preview-file-icon">
                            <i class="fas fa-file-video"></i>
                        </div>
                        <div class="preview-file-name" id="source-name">source.mp4</div>
                        <div class="preview-file-details" id="source-details">1920x1080 • 125MB</div>
                    </div>
                    <div class="conversion-arrow">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                    <div class="preview-file">
                        <div class="preview-file-icon">
                            <i class="fas fa-file-video"></i>
                        </div>
                        <div class="preview-file-name" id="target-name">target.avi</div>
                        <div class="preview-file-details" id="target-details">1920x1080 • 180MB</div>
                    </div>
                </div>
                <p>Our converter supports all major video formats. Try selecting different formats and qualities to see how the conversion works.</p>
            </div>
        `;

        // Add interactivity to the demo
        const fileInputArea = document.getElementById('file-input-area');
        const browseBtn = document.getElementById('browse-btn');
        const formatSelect = document.getElementById('format-select');
        const qualitySelect = document.getElementById('quality-select');
        const convertBtn = document.getElementById('convert-btn');
        const conversionPreview = document.getElementById('conversion-preview');
        // const sourceName = document.getElementById('source-name'); // Unused
        // const sourceDetails = document.getElementById('source-details'); // Unused
        const targetName = document.getElementById('target-name');
        const targetDetails = document.getElementById('target-details');

        // Simulate file selection
        browseBtn.addEventListener('click', () => {
            fileInputArea.classList.add('active');
            fileInputArea.innerHTML = `
                <div class="file-input-icon">
                    <i class="fas fa-file-video"></i>
                </div>
                <div class="file-input-text">sample_video.mp4</div>
                <button class="browse-button" id="change-file">Change File</button>
            `;

            document.getElementById('change-file').addEventListener('click', () => {
                location.reload(); // Simple reload for demo purposes
            });

            // Enable convert button
            convertBtn.disabled = false;

            // Update preview
            updateConversionPreview();
        });

        // Update preview when format or quality changes
        formatSelect.addEventListener('change', updateConversionPreview);
        qualitySelect.addEventListener('change', updateConversionPreview);

        // Convert button click handler
        convertBtn.addEventListener('click', () => {
            // Show conversion in progress
            convertBtn.textContent = 'Converting...';
            convertBtn.disabled = true;

            // Simulate conversion progress
            setTimeout(() => {
                // Show success message
                const message = document.createElement('p');
                message.textContent = 'Conversion completed successfully!';
                message.style.color = '#28a745';
                message.style.marginTop = '20px';
                message.style.fontWeight = '600';
                document.querySelector('.format-conversion-demo').appendChild(message);

                // Reset button after 3 seconds
                setTimeout(() => {
                    message.remove();
                    convertBtn.textContent = 'Convert Another File';
                    convertBtn.disabled = false;
                }, 3000);
            }, 3000);
        });

        function updateConversionPreview() {
            if (convertBtn.disabled === false) {
                conversionPreview.style.display = 'flex';

                // Update target file name
                const format = formatSelect.value;
                targetName.textContent = `sample_video.${format}`;

                // Update target file details based on format and quality
                const quality = qualitySelect.value;
                let dimensions, size;

                switch (quality) {
                    case '4k':
                        dimensions = '3840x2160';
                        size = format === 'mp4' ? '520MB' : format === 'avi' ? '750MB' : '480MB';
                        break;
                    case '1080p':
                        dimensions = '1920x1080';
                        size = format === 'mp4' ? '125MB' : format === 'avi' ? '180MB' : '115MB';
                        break;
                    case '720p':
                        dimensions = '1280x720';
                        size = format === 'mp4' ? '65MB' : format === 'avi' ? '95MB' : '60MB';
                        break;
                    case '480p':
                        dimensions = '854x480';
                        size = format === 'mp4' ? '35MB' : format === 'avi' ? '50MB' : '32MB';
                        break;
                }

                targetDetails.textContent = `${dimensions} • ${size}`;
            }
        }
    }

    // Load Audio Extraction Demo
    function loadAudioExtractionDemo() {
        demoContainer.innerHTML = `
            <h2>Audio Extraction Demo</h2>
            <div class="audio-extraction-demo">
                <div class="extraction-interface">
                    <div class="video-preview-audio">
                        <img src="https://picsum.photos/seed/audiovideo/800/450.jpg" alt="Video preview">
                    </div>
                    <div class="extraction-options">
                        <select class="format-select-audio" id="audio-format-select">
                            <option value="mp3">MP3</option>
                            <option value="wav">WAV</option>
                            <option value="flac">FLAC</option>
                            <option value="aac">AAC</option>
                            <option value="ogg">OGG</option>
                        </select>
                        <select class="quality-select-audio" id="audio-quality-select">
                            <option value="320">320 kbps</option>
                            <option value="256">256 kbps</option>
                            <option value="192">192 kbps</option>
                            <option value="128">128 kbps</option>
                        </select>
                    </div>
                    <button class="extract-button" id="extract-btn">Extract Audio</button>
                </div>
                <div class="audio-waveform" id="audio-waveform" style="display: none;">
                    <div class="waveform-bars" id="waveform-bars"></div>
                </div>
                <p>Extract high-quality audio from any video. Select your preferred format and quality, then click the extract button.</p>
            </div>
        `;

        // Add interactivity to the demo
        const extractBtn = document.getElementById('extract-btn');
        const audioWaveform = document.getElementById('audio-waveform');
        const waveformBars = document.getElementById('waveform-bars');
        const audioFormatSelect = document.getElementById('audio-format-select');
        const audioQualitySelect = document.getElementById('audio-quality-select');

        // Generate waveform bars
        function generateWaveform() {
            waveformBars.innerHTML = '';
            const barCount = 50;

            for (let i = 0; i < barCount; i++) {
                const bar = document.createElement('div');
                bar.className = 'waveform-bar';
                bar.style.height = `${Math.random() * 60 + 20}px`;
                bar.style.animationDelay = `${i * 0.05}s`;
                waveformBars.appendChild(bar);
            }
        }

        // Extract button click handler
        extractBtn.addEventListener('click', () => {
            // Show extraction in progress
            extractBtn.textContent = 'Extracting...';
            extractBtn.disabled = true;

            // Simulate extraction progress
            setTimeout(() => {
                // Show waveform
                audioWaveform.style.display = 'block';
                generateWaveform();

                // Animate waveform bars
                const bars = document.querySelectorAll('.waveform-bar');
                bars.forEach(bar => {
                    bar.style.animation = 'wave 1.5s ease-in-out infinite alternate';
                });

                // Show success message
                const format = audioFormatSelect.value.toUpperCase();
                const quality = audioQualitySelect.value;
                const message = document.createElement('p');
                message.textContent = `Audio extracted successfully! Format: ${format}, Quality: ${quality} kbps`;
                message.style.color = '#28a745';
                message.style.marginTop = '20px';
                message.style.fontWeight = '600';
                document.querySelector('.audio-extraction-demo').appendChild(message);

                // Reset button after 3 seconds
                setTimeout(() => {
                    message.remove();
                    extractBtn.textContent = 'Extract Another Audio';
                    extractBtn.disabled = false;
                }, 3000);
            }, 2000);
        });

        // Add waveform animation to CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes wave {
                0% { height: 20px; }
                100% { height: 80px; }
            }
        `;
        document.head.appendChild(style);
    }

    // Load Cloud Storage Demo
    function loadCloudStorageDemo() {
        demoContainer.innerHTML = `
            <h2>Cloud Storage Demo</h2>
            <div class="cloud-storage-demo">
                <div class="cloud-interface">
                    <div class="cloud-providers">
                        <div class="cloud-provider" data-provider="google-drive">
                            <div class="cloud-provider-icon" style="color: #4285F4;">
                                <i class="fab fa-google-drive"></i>
                            </div>
                            <div class="cloud-provider-name">Google Drive</div>
                        </div>
                        <div class="cloud-provider" data-provider="dropbox">
                            <div class="cloud-provider-icon" style="color: #0061FF;">
                                <i class="fab fa-dropbox"></i>
                            </div>
                            <div class="cloud-provider-name">Dropbox</div>
                        </div>
                        <div class="cloud-provider" data-provider="onedrive">
                            <div class="cloud-provider-icon" style="color: #0078D4;">
                                <i class="fab fa-microsoft"></i>
                            </div>
                            <div class="cloud-provider-name">OneDrive</div>
                        </div>
                    </div>
                    <button class="cloud-storage-button" id="sync-button" disabled>Select a Cloud Provider</button>
                </div>
                <div class="storage-status" id="storage-status" style="display: none;">
                    <div class="status-title">Storage Status</div>
                    <div class="storage-bar">
                        <div class="storage-used" id="storage-used" style="width: 30%;"></div>
                    </div>
                    <div class="storage-details">
                        <span id="storage-used-text">3.0 GB used</span>
                        <span>10 GB total</span>
                    </div>
                </div>
                <div class="file-list" id="file-list" style="display: none;">
                    <div class="file-item">
                        <div class="file-icon" style="color: #4285F4;">
                            <i class="fas fa-file-video"></i>
                        </div>
                        <div class="file-info">
                            <div class="file-name">Tutorial Video.mp4</div>
                            <div class="file-details">125 MB • Modified 2 days ago</div>
                        </div>
                        <div class="file-status">
                            <i class="fas fa-check-circle" style="color: #28a745;"></i>
                        </div>
                    </div>
                    <div class="file-item">
                        <div class="file-icon" style="color: #4285F4;">
                            <i class="fas fa-file-audio"></i>
                        </div>
                        <div class="file-info">
                            <div class="file-name">Podcast Episode.mp3</div>
                            <div class="file-details">45 MB • Modified 1 week ago</div>
                        </div>
                        <div class="file-status">
                            <i class="fas fa-check-circle" style="color: #28a745;"></i>
                        </div>
                    </div>
                    <div class="file-item">
                        <div class="file-icon" style="color: #4285F4;">
                            <i class="fas fa-file-video"></i>
                        </div>
                        <div class="file-info">
                            <div class="file-name">Presentation.avi</div>
                            <div class="file-details">280 MB • Modified 3 weeks ago</div>
                        </div>
                        <div class="file-status">
                            <i class="fas fa-check-circle" style="color: #28a745;"></i>
                        </div>
                    </div>
                </div>
                <p>Connect to your favorite cloud storage service to save your downloads directly. Select a provider to see how it works.</p>
            </div>
        `;

        // Add interactivity to the demo
        const cloudProviders = document.querySelectorAll('.cloud-provider');
        const syncButton = document.getElementById('sync-button');
        const storageStatus = document.getElementById('storage-status');
        const storageUsed = document.getElementById('storage-used');
        const storageUsedText = document.getElementById('storage-used-text');
        const fileList = document.getElementById('file-list');
        let selectedProvider = null;

        // Cloud provider selection
        cloudProviders.forEach(provider => {
            provider.addEventListener('click', () => {
                // Remove active class from all providers
                cloudProviders.forEach(p => p.classList.remove('active'));

                // Add active class to selected provider
                provider.classList.add('active');

                // Update selected provider
                selectedProvider = provider.getAttribute('data-provider');

                // Update sync button
                syncButton.textContent = `Sync with ${provider.querySelector('.cloud-provider-name').textContent}`;
                syncButton.disabled = false;
            });
        });

        // Sync button click handler
        syncButton.addEventListener('click', () => {
            if (selectedProvider) {
                // Show syncing state
                syncButton.textContent = 'Syncing...';
                syncButton.disabled = true;

                // Simulate sync process
                setTimeout(() => {
                    // Show storage status and file list
                    storageStatus.style.display = 'block';
                    fileList.style.display = 'block';

                    // Animate storage used bar
                    let usedPercent = 0;
                    const targetPercent = 30;
                    const animateStorage = setInterval(() => {
                        if (usedPercent < targetPercent) {
                            usedPercent++;
                            storageUsed.style.width = `${usedPercent}%`;
                            storageUsedText.textContent = `${(usedPercent / 10).toFixed(1)} GB used`;
                        } else {
                            clearInterval(animateStorage);
                        }
                    }, 30);

                    // Show success message
                    const message = document.createElement('p');
                    message.textContent = 'Sync completed successfully!';
                    message.style.color = '#28a745';
                    message.style.marginTop = '20px';
                    message.style.fontWeight = '600';
                    document.querySelector('.cloud-storage-demo').appendChild(message);

                    // Reset button after 3 seconds
                    setTimeout(() => {
                        message.remove();
                        syncButton.textContent = 'Sync Again';
                        syncButton.disabled = false;
                    }, 3000);
                }, 2000);
            }
        });
    }

    // Clean up intervals when modal is closed
    modal.addEventListener('transitionend', () => {
        if (!modal.classList.contains('active')) {
            if (demoContainer.moveCursorInterval) {
                clearInterval(demoContainer.moveCursorInterval);
            }
            if (demoContainer.updateProgressInterval) {
                clearInterval(demoContainer.updateProgressInterval);
            }
        }
    });
});
