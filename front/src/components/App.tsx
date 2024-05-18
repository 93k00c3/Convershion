import React, { ChangeEvent, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';
import "./App.css";
import { Link } from 'react-router-dom';
import ErrorModal from './folder/ErrorModal.tsx';
import AnimatedWaves from './folder/waves.tsx';

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
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalMessage, setModalMessage] = useState<string>('');
    const [isDragActive, setIsDragActive] = useState(false);
    const [draggedFiles, setDraggedFiles] = useState<FileList | null>(null);

    const navigate = useNavigate();
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        const files = e.dataTransfer.files;
        setDraggedFiles(files);
        handleFileChange({ target: { files } } as any);
    };
    const handleFileClick = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.accept = '.mp3,.flac,.wav,.alac';
        fileInput.addEventListener('change', (event) => {
            handleFileChange(event);
        });
        fileInput.click();
    };

    const handleFileUpload = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedFiles || selectedFiles.length === 0) return;
        if (selectedFiles.length > 5) {
            setModalMessage('Too many files selected. Please select up to 5 files.');
            setShowModal(true);
            return;
        }
        const formData = new FormData();
        for (let i = 0; i < selectedFiles.length; i++) {
            formData.append('file', selectedFiles[i]);
        }

        try {
            const response = await axios.post('http://localhost:5000/', formData, {
                onUploadProgress: (progressEvent) => {
                    const { loaded, total } = progressEvent;
                    let percentage = Math.floor((loaded * 100) / total);
                    setUploadProgress(percentage);
                },
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });
            console.log("Success uploading files");
            setUploadSuccess(true);
        } catch (error) {
            if (error.response) {
                const errorMessage = error.response.data.error;
                setModalMessage(errorMessage);
                setShowModal(true);
            } else {
                console.error('Error:', error);
            }
        }
        navigate('/conversion');
    }, [navigate, selectedFiles]);

    const closeModal = () => {
        setShowModal(false);
    };

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!Cookies.get('guest_folder') && !Cookies.get('session')) {
            console.log('No guest folder found, creating one');
            const guestFolderId = uuidv4();
            Cookies.set('guest_folder', guestFolderId, { expires: 7, secure: true });
        }
        else if(Cookies.get('session')) {
            Cookies.remove('guest_folder');
        }
        if (!files) return;
        if (files.length > 5) {
            setModalMessage('Too many files selected. Please select up to 5 files.');
            setShowModal(true);
            return;
        }
        const allowedTypes = ['mp3', 'flac', 'wav', 'alac'];
        setSelectedFiles(files);
        setIsFileSelected(true);
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('file', files[i], files[i].name);
        }

        try {
            setIsGenerating(true);
            const response = await fetch('http://localhost:5000/graph', {
                method: 'POST',
                body: formData,
                credentials: 'include'
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
        } finally {
            setIsLoading(false);
            setIsGenerating(false);
        }
    };

    return (
        <div className="outer-container">

            <div className="leftText">
                <h1>convershion</h1>
                <p>Upload an audio file and we will generate a visual representation of the audio data, after that convert the file to any compatible format.</p>
                <AnimatedWaves />
            </div>
            <div className="container">
                <div className='container-items'>
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
                        
                        {isGenerating ? (
                            <div className='ml-48 justify-center items-center'>
                                <div className="circular-loader self-center"></div>
                            </div>
                        ) : (
                            <div>
                                
                                {imageUrls.map((imageData, index) => (
                                    <div key={index}>
                                        <p className='py-4'>Generated Image: {imageData.filename}</p>
                                        <img src={imageData.image_url} alt={imageData.filename} />
                                    </div>
                                ))}
                            </div>
                        )}
                        </div>
                    {!isGenerating &&
                    <div
                        className={`dropZone ${isDragActive ? 'active' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleFileClick}
                    >
                        {isDragActive ? (
                            <p>Drop files here</p>
                        ) : (
                            <p>Drag and drop files here, or click to select files</p>
                        )}
                    </div>
                    }
                    
                    <div>
                        {(!isGenerating && !isLoading && isFileSelected) && (
                            <input type="submit" value="Upload" className="bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded mt-4" />
                        )}
                    </div>
                </form>
                
                {showModal && <ErrorModal message={modalMessage} onClose={closeModal} />}
            </div>
            <div className="compare-link-container">
                <Link to="/compare" className="compare-link">
                   or just compare files <span>&rarr;</span>
                </Link>
            </div>
            </div>
            
            
        </div>
    );
};

export default App;
