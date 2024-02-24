import React, { ChangeEvent, useState } from 'react';
import "./App.css";

interface ImageData {
    filename: string;
    image_url: string;
}

const App: React.FC = () => {
    const [imageUrls, setImageUrls] = useState<ImageData[]>([]);

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
        <div className="outer-container"> 
            <div className="container"> 
                <label className="upload-button"> 
                    Upload files
                    <input type="file" name="file" accept="mp3,flac,wav,alac" multiple onChange={handleFileChange} />
                </label>
                <div id="graph"> 
                    {imageUrls.map((imageData, index) => (
                        <img key={index} src={imageData.image_url} alt={`Graph ${index}`} />
                    ))}
                </div>
            </div>
        </div>
    );
};    

export default App;
