import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import axios from 'axios';
import './conversion.css';

interface ConversionProps {
    files: string[];
    availableExtensions: {
        mp3: boolean; 
        flac: boolean; 
        m4a: boolean; 
        wav: boolean; 
    };
}

const Conversion: React.FC<ConversionProps> = (availableExtensions) => {
    const [selectedConversionType, setSelectedConversionType] = useState('');
    const [audioFilter, setAudioFilter] = useState('');
    const [silenceThreshold, setSilenceThreshold] = useState(-30);
    const [silenceDuration, setSilenceDuration] = useState(1);
    const [volumeLevel, setVolumeLevel] = useState(100);
    const [fetchedFiles, setFetchedFiles] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`http://localhost:5000/conversion`); 
            const data = await response.json();
            setFetchedFiles(data.files);
        };
        fetchData();
    }, []); 

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        const fileName = e.target.value;
        if (isChecked && selectedFiles.length < 3) {
            setSelectedFiles([...selectedFiles, fileName]);
        } else if (!isChecked) {
            setSelectedFiles(selectedFiles.filter((file) => file !== fileName));
        } else {
            e.preventDefault();
        }
    };

    const handleConversionTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedConversionType(e.target.value);
    };

    const handleSilencedetectClick = () => {
        setAudioFilter('silencedetect');
    };

    const handleVolumeClick = () => {
        setAudioFilter('volume');
    };

    const handleSilenceThresholdChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSilenceThreshold(parseInt(e.target.value, 10));
        document.getElementById('silence_threshold_value')!.textContent = `${e.target.value} dB`;
    };

    const handleSilenceDurationChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSilenceDuration(parseInt(e.target.value, 10));
    };

    const handleVolumeLevelChange = (e: ChangeEvent<HTMLInputElement>) => {
        setVolumeLevel(parseInt(e.target.value, 10));
        document.getElementById('volume_level_value')!.textContent = `${e.target.value}%`;
    };

    const handleSubmit = async () => {
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('files', file));  
        formData.append('conversion_type', selectedConversionType); 
        formData.append('audio_filter', audioFilter);
        if (audioFilter === 'silencedetect') {
            formData.append('silence_threshold', silenceThreshold.toString());
            formData.append('silence_duration', silenceDuration.toString());
        } else if (audioFilter === 'volume') {
            formData.append('volume_level', volumeLevel.toString());
        }
        try {
            const response = await axios.post('http://localhost:5000/conversion', formData);
            console.log(response.data);
            if(response.status === 200) {
                console.log("Success converting files");
                const fetchData = async () => {
                    const response = await fetch(`http://localhost:5000/conversion`); 
                    const data = await response.json();
                    setFetchedFiles(data.files);
                };
                fetchData();
            }
        } catch (error) {
            console.error('Error during conversion:', error);
        }
    };


    return (
            <div className="container bg-slate-700 mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Select files to convert:</h1>
                <form id="conversionForm" onSubmit={handleSubmit}>
                    <ul>
                    {fetchedFiles.map((file, index) => (
                        <li key={index} className="mb-2">
                            <input 
                            type="checkbox" 
                            name="files" 
                            value={file} 
                            className="mr-2" 
                            onChange={handleFileChange}
                            disabled={selectedFiles.length >= 3 && !selectedFiles.includes(file)}/>
                            {file}
                        </li>
                    ))}
                    </ul>
                    <label htmlFor="conversion_type" className="block mb-2">Select conversion type:</label>
                        <input type="radio" name="conversion_type" value="mp3" id="mp3_option"
                        checked={selectedConversionType === 'mp3'} 
                        onChange={handleConversionTypeChange}  />
                        <label htmlFor="mp3_option">MP3</label><br/>

                        <input type="radio" name="conversion_type" value="flac" id="flac_option"
                        checked={selectedConversionType === 'flac'} 
                        onChange={handleConversionTypeChange} />
                        <label htmlFor="flac_option">FLAC</label><br/>

                        <input type="radio" name="conversion_type" value="m4a" id="m4a_option" 
                        checked={selectedConversionType === 'm4a'} 
                        onChange={handleConversionTypeChange}/>
                        <label htmlFor="m4a_option">ALAC/M4A</label><br/>

                        <input type="radio" name="conversion_type" value="wav" id="wav_option" 
                        checked={selectedConversionType === 'wav'} 
                        onChange={handleConversionTypeChange}/>
                        <label htmlFor="wav_option">WAV</label><br/>
                    <div className="mb-4">
                        <input type="radio" name="audio_filter" value="silencedetect" id="silencedetect_flag" onClick={handleSilencedetectClick} />
                        <label htmlFor="silencedetect_flag" className="ml-2">Enable silence detect:</label>
                    </div>
                    <div id="silencedetect_params" style={{ display: audioFilter === 'silencedetect' ? 'block' : 'none' }}>
                        <label htmlFor="silence_threshold" className="block mb-2">Silence Threshold:</label>
                        <input type="range" name="silence_threshold" id="silence_threshold" min="-100" max="0" step="1" value="-30" onChange={handleSilenceThresholdChange} className="mb-2"/>
                        <span id="silence_threshold_value" className="mb-4">-30 dB</span>
                        <label htmlFor="silence_duration" className="block mb-2">Silence Duration (seconds):</label>
                        <input type="number" name="silence_duration" id="silence_duration" min="0" step="1" value="1" className="mb-2" onChange={handleSilenceDurationChange}/>
                        <span className="block mb-4">For 0: silence from whole track is being deleted</span>
                    </div>
                    
                <h2 className="text-xl font-bold mt-8 mb-4">Audio Filters:</h2>
                <div className="mb-4">
                        <input type="radio" name="audio_filter" value="volume" id="volume_flag" onClick={handleVolumeClick} />
                        <label htmlFor="volume_flag" className="ml-2">Change volume:</label>
                    </div>
                    <div id="volume_params" style={{ display: audioFilter === 'volume' ? 'block' : 'none' }}>
                        <label htmlFor="volume_level" className="block mb-2">Change volume level:</label>
                        <input type="range" name="volume_level" id="volume_level" min="0" max="200" step="1" value="100" onChange={handleVolumeLevelChange} className="mb-2"/>
                        <span id="volume_level_value" className="mb-4">100%</span>
                    </div>
                    </form>
                    <input type="submit" id="convertButton" value="Convert" onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" />
            </div>
        );
};

export default Conversion;
