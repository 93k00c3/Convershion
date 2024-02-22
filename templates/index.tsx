import React, { ChangeEvent, useState } from 'react';

const Uploader: React.FC = () => {
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('file', files[i], files[i].name);
        }

        try {
            const response = await fetch('/graph', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const result = await response.json();
            if (result && result.image_urls) {
                setImageUrls(result.image_urls);
            } else {
                throw new Error('Unexpected response format');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div>
            <h1>Uploader</h1>
            <label>
                Upload multiple files:
                <input type="file" name="file" accept="mp3,flac,wav,alac" multiple onChange={handleFileChange} />
            </label>
            <div id="graph">
                {imageUrls.map((imageUrl, index) => (
                    <img key={index} src={imageUrl} alt={`Graph ${index}`} />
                ))}
            </div>
            <label htmlFor="dropzone-file">
                <div>
                    <span>Click to upload or drag and drop</span>
                    <p>MP3, ALAC, FLAC, WAV</p>
                </div>
                <input id="dropzone-file" type="file" className="hidden" />
                <input type="submit" value="Upload file"/>
            </label>
        </div>
    );
};

export default Uploader;
