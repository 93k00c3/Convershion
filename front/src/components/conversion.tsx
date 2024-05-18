import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import './conversion.css';
import AnimatedWaves from './folder/waves.tsx';
import { resolvePath } from 'react-router-dom';
import Cookies from 'js-cookie';
import ErrorModal from './folder/ErrorModal.tsx';
import FolderExplorer from './folder/FolderExplorer.tsx';


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
    const [audioFilters, setAudioFilters] = useState<('silencedetect' | 'volume')[]>([]);
    const [silenceThreshold, setSilenceThreshold] = useState(-30);
    const [silenceDuration, setSilenceDuration] = useState(1);
    const [volumeLevel, setVolumeLevel] = useState(100);
    const [selectedBitrate, setSelectedBitrate] = useState('320');
    const [fetchedFiles, setFetchedFiles] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalMessage, setModalMessage] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showFolderExplorer, setShowFolderExplorer] = useState(false);
    const [mp3ConversionModalShown, setMp3ConversionModalShown] = useState(false);

    useEffect(() => {
      const fetchData = async () => {
          try {
              const response = await fetch(`http://localhost:5000/conversion`, {
                  credentials: 'include'
              });
              const data = await response.json();
              if (!response.ok) {
                const errorMessage = data.error;
                  if (response.status === 401) {
                      setShowModal(true);
                      setModalMessage("Error: " + errorMessage);
                  }
                  if (response.status === 404) {
                      setShowModal(true);
                      setModalMessage("Error: " + errorMessage);
                      console.log("Error occurred. Please try again...");
                  }
                  if (response.status === 400) {
                      setShowModal(true);
                      console.log("Error occurred: ", errorMessage);
                      setModalMessage("Error: " + errorMessage);
                  }
                  throw new Error(response.statusText);
              }
              setFetchedFiles(data.files);
          } catch (error) {

              console.error('Error fetching data:', error);
          }
        };
      const checkSession = () => {
        const sessionCookie = Cookies.get('session');
        if (sessionCookie) {
          Cookies.remove('guest_folder');
        }
      }
  
      fetchData();
      checkSession();
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

    const toggleFolderExplorer = () => {
      setShowFolderExplorer(!showFolderExplorer);
    };

    const handleBitrateChange = (e: ChangeEvent<HTMLSelectElement>) => {
      setSelectedBitrate(e.target.value);
    };

    const handleConversionTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedConversionType(e.target.value);
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

    const handleCheckboxChange = (filterType: 'silencedetect' | 'volume') => {
        setAudioFilters(prevFilters => {
            if (prevFilters.includes(filterType)) {
                return prevFilters.filter(filter => filter !== filterType);
            } else {
                return [...prevFilters, filterType];
            }
        });
    };

    const showFilterOptions = () => {
        return (
            <>
                {audioFilters.includes('silencedetect') && (
                    <div id="silencedetect_params" className="mb-6">
                        <label htmlFor="silence_threshold" className="block mb-2">
                            Silence Threshold:
                        </label>
                        <input
                            type="range"
                            name="silence_threshold"
                            id="silence_threshold"
                            min="-100"
                            max="0"
                            step="1"
                            value={silenceThreshold}
                            onChange={handleSilenceThresholdChange}
                            className="mb-2"
                        />
                        <span id="silence_threshold_value" className="mb-4">
                            {silenceThreshold} dB
                        </span>
                        <label htmlFor="silence_duration" className="block mb-2">
                            Silence Duration (seconds):
                        </label>
                        <input
                            type="number"
                            name="silence_duration"
                            id="silence_duration"
                            min="0"
                            step="1"
                            value={silenceDuration}
                            className="input-number mb-2"
                            onChange={handleSilenceDurationChange}
                        />
                        <span className="block mb-4">For 0: silence from whole track is being deleted</span>
                    </div>
                )}

                {audioFilters.includes('volume') && (
                    <div id="volume_params" className="mb-6">
                        <label htmlFor="volume_level" className="block mb-2">
                            Change volume level:
                        </label>
                        <input
                            type="range"
                            name="volume_level"
                            id="volume_level"
                            min="0"
                            max="200"
                            step="1"
                            value={volumeLevel}
                            onChange={handleVolumeLevelChange}
                            className="mb-2"
                        />
                        <span id="volume_level_value" className="mb-4">
                            {volumeLevel}%
                        </span>
                    </div>
                )}
            </>
        );
    };

    const handleSubmit = async () => {
        const hasMp3Files = selectedFiles.some(file => file.toLowerCase().endsWith('.mp3'));
        if(hasMp3Files && selectedConversionType !== 'mp3' && !mp3ConversionModalShown){
            setModalMessage('Warning! You are trying to convert from lossy format to losless format which will still result in lossy audio. Are you sure you want to continue?');
            setShowModal(true);
            setMp3ConversionModalShown(true);
            return;
        }
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('files', file));
        formData.append('conversion_type', selectedConversionType);
        formData.append('audio_filter', audioFilters.join(','));
        if (selectedConversionType === 'mp3'){
        formData.append('mp3_bitrate', selectedBitrate); 
        }
        if (audioFilters.includes('silencedetect')) {
            formData.append('silence_threshold', silenceThreshold.toString());
            formData.append('silence_duration', silenceDuration.toString());
        }
        if (audioFilters.includes('volume')) {
            formData.append('volume_level', volumeLevel.toString());
        }
        try {
          setIsGenerating(true);
            const response = await axios.post('http://localhost:5000/conversion', formData, {
                withCredentials: true
            });
            if (response.status === 200) {
                console.log("Success converting files");
                const fetchData = async () => {
                    const response = await fetch(`http://localhost:5000/conversion`, {
                        credentials: 'include',
                    });
                    const data = await response.json();
                    setFetchedFiles(data.files);
                };
                fetchData();
              }
        } catch (error) {
          if (error.response && error.response.status === 400) {
            setModalMessage(error.response.data.error);
            setShowModal(true);
          } else {
          console.error('Error:', error);
        }
      }
      setIsGenerating(false);
    };

    const closeModal = () => {
      setShowModal(false);
      if (modalMessage.includes('Error')) {
        window.location.href = '/';
      }
    };



    return (
        <div className="relative h-fit">
            <div className="conversion-main-container md:flex-row items-center justify-center min-h-[480px]">
                <div className="md:pr-8 mb-4 md:mb-0 md: pt-4">
                    <h1 className="text-2xl font-bold mb-2">Select files to convert:</h1>
                    <ul>
                        {fetchedFiles && fetchedFiles.map((file, index) => (
                            <li key={index} className="mb-2">
                                <input
                                    type="checkbox"
                                    name="files"
                                    value={file}
                                    className="mr-2"
                                    onChange={handleFileChange}
                                    disabled={selectedFiles.length >= 3 && !selectedFiles.includes(file)}
                                />
                                {file}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="md:w-1/2 py-4 mt-6">
                    <form id="conversionForm" onSubmit={handleSubmit}>
                        <div className="conversion-container pt-4 p-4 bg-gray-800 rounded-lg shadow-md mb-8">
                            <h2 className="text-xl font-bold pb-2">Select conversion type:</h2>
                            <div className="conversion-type">
                                <input
                                    type="radio"
                                    name="conversion_type"
                                    value="mp3"
                                    id="mp3_option"
                                    checked={selectedConversionType === 'mp3'}
                                    onChange={handleConversionTypeChange}
                                    className="mr-2"
                                />
                                <label htmlFor="mp3_option" className="mr-4">
                                    MP3
                                </label>
                                {selectedConversionType === 'mp3' && (
                                <div>
                                <label htmlFor="mp3_bitrate">Bitrate:</label>
                                <select 
                                    name="mp3_bitrate" 
                                    id="mp3_bitrate" 
                                    className='mb-2 ml-2 bg-gray-700 text-white rounded-md p-1 w-24'
                                    value={selectedBitrate}
                                    onChange={handleBitrateChange}
                                >
                                    <option value="320">320 kbps</option>
                                    <option value="256">256 kbps</option>
                                    <option value="192">192 kbps</option>
                                    <option value="128">128 kbps</option>
                                </select>
                                </div>
                                )}
                                <input
                                    type="radio"
                                    name="conversion_type"
                                    value="flac"
                                    id="flac_option"
                                    checked={selectedConversionType === 'flac'}
                                    onChange={handleConversionTypeChange}
                                    className="mr-2"
                                />
                                <label htmlFor="flac_option" className="mr-4">
                                    FLAC
                                </label>
                                <input
                                    type="radio"
                                    name="conversion_type"
                                    value="m4a"
                                    id="m4a_option"
                                    checked={selectedConversionType === 'm4a'}
                                    onChange={handleConversionTypeChange}
                                    className="mr-2"
                                />
                                <label htmlFor="m4a_option" className="mr-4">
                                    ALAC/M4A
                                </label>
                                <input
                                    type="radio"
                                    name="conversion_type"
                                    value="wav"
                                    id="wav_option"
                                    checked={selectedConversionType === 'wav'}
                                    onChange={handleConversionTypeChange}
                                    className="mr-2"
                                />
                                <label htmlFor="wav_option">WAV</label>
                            </div>

                            <h2 className="text-xl font-bold my-4">Audio Filters:</h2>
                            <div className="mb-4">
                                <input
                                    type="checkbox"
                                    name="audio_filter"
                                    value="silencedetect"
                                    id="silencedetect_flag"
                                    className="mr-2"
                                    checked={audioFilters.includes('silencedetect')}
                                    onChange={() => handleCheckboxChange('silencedetect')}
                                />
                                <label htmlFor="silencedetect_flag">Enable silence detect:</label>
                            </div>

                            <div className="mb-4">
                                <input
                                    type="checkbox"
                                    name="audio_filter"
                                    value="volume"
                                    id="volume_flag"
                                    className="mr-2"
                                    checked={audioFilters.includes('volume')}
                                    onChange={() => handleCheckboxChange('volume')}
                                />
                                <label htmlFor="volume_flag">Change volume:</label>
                            </div>
                            {showFilterOptions()}
                        </div>
                    </form>
                </div>
            </div>
            {!isGenerating ? (
            <div className="flex justify-center">
                <input
                    type="submit"
                    id="convertButton"
                    value="Convert"
                    onClick={handleSubmit}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                />
            </div>
            ) : (
            <div className="flex justify-center">
                <div className="circular-loader self-center"></div>
            </div>
              )
            }
            {Cookies.get('session') ? (
                <div>
                    <div className="flex justify-center mt-4">
                        <button onClick={toggleFolderExplorer} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                            {showFolderExplorer ? "Hide Files" : "Show Files"}
                        </button>
                    </div>
                    {showFolderExplorer && <FolderExplorer />}
                </div>
            ) : (

              <p className='flex pt-4 justify-center'>To see file properties you need to login</p>
            )}
            <div className='waves'>
                        <AnimatedWaves />
                    </div>
            {showModal && <ErrorModal message={modalMessage} onClose={closeModal} />}
        </div>
    );
};

export default Conversion;