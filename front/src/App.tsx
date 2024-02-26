import React, { ChangeEvent, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import "./App.css";

interface ImageData {
    filename: string;
    image_url: string;
}

const App: React.FC = () => {
    const [isFileSelected, setIsFileSelected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);   
    const [imageUrls, setImageUrls] = useState<ImageData[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const useFileUpload = () => {
        const navigate = useNavigate();

        const handleFileUpload = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
            if (!selectedFiles) return; 
            event.preventDefault();
            try {
                const formData = new FormData();
                for (let i = 0; i < selectedFiles.length; i++) {
                    formData.append('file', selectedFiles[i]);
                }

                const response = await fetch('/', {
                    method: 'POST',
                    body: formData
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                navigate('/conversion', { state: { selectedFiles } }); 
            } catch (error) {
                console.error('Error:', error);
                // Handle errors appropriately
            }
        }, [selectedFiles, navigate]);

        return { handleFileUpload }; 
    };

    const { handleFileUpload } = useFileUpload(); 

    // const handleFileUpload = async () => {
    //     if (!selectedFiles) return;
    //     const formData = new FormData();
    //     for (let i = 0; i < selectedFiles.length; i++) {
    //         formData.append('file', selectedFiles[i]);
    //     }
    
    //     try {
    //         const response = await fetch('/', {
    //             method: 'POST',
    //             body: formData
    //         });
    //         if (!response.ok) {
    //             throw new Error('Network response was not ok');
    //         }
    //         const navigate = useNavigate(); 
    //         navigate('/conversion', { state: { selectedFiles } });
    //     } catch (error) {
    //         console.error('Error:', error);
    //     }
    
    // };

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        const allowedTypes = ['mp3', 'flac', 'wav', 'alac'];    
        setSelectedFiles(files);
        setIsFileSelected(true); 
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('file', files[i], files[i].name);
        }

        try {
            setIsGenerating(true);
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
        finally {
            setIsLoading(false); 
            setIsGenerating(false); 
        }
    };
    

    return (
        <div className="outer-container"> 
            <div className="container"> 
            <form onSubmit={handleFileUpload}>
            {(!isGenerating && !isLoading && !isFileSelected) && <label className="upload-button"> 
                    Select file
                    <input type="file" name="file" accept=".mp3,.flac,.wav,.alac" multiple onChange={handleFileChange} />
                </label>
                }
                
                <div id="graph">
                    {isGenerating && selectedFiles && selectedFiles.length > 0 && (
                        <div>
                            <p>Selected File: {selectedFiles[0].name}</p>
                        </div>
                    )}
                    {!isGenerating && selectedFiles && selectedFiles.length > 0 && (
                        <div>
                            <p>{selectedFiles[0].name}</p>
                        </div>
                    )}
                    {isGenerating ? (
                        <div className="circular-loader self-center"></div> 
                    ) : (
                        imageUrls.map((imageData, index) => (
                            <img key={index} src={imageData.image_url} alt={`Graph ${index}`} />
                        ))
                    )}
                </div>
                <div>
                    {(!isGenerating && !isLoading && isFileSelected) && ( 
                        <input type="submit" value="Upload" className="bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded mt-4"/> 
                    )} 
                </div>
                </form>
            </div>    
        </div>
    );
};    

export default App;
