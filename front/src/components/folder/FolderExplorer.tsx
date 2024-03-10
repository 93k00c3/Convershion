import React, { useState, useEffect, FC } from 'react';
import './FolderExplorer.css';
import ErrorModal from './ErrorModal.tsx';
import { FaDownload } from "react-icons/fa";
import { MdDriveFileRenameOutline, MdOutlineDelete, MdOutlineGraphicEq } from "react-icons/md";

interface File {
  name: string;
  type: 'file';
  metadata?: {
    length?: number;
    bitrate?: number;
    sample_rate?: number;
    channels?: number;
    artist?: string[]; 
    title?: string[]; 
  };
}

interface FolderExplorerProps {
  data: Folder | null;
}

interface Folder {
  name: string;
  type: 'folder';
  items?: (Folder[] | File[])[];
}


const FolderExplorer: React.FC<FolderExplorerProps> = () => { 
  const [data, setData] = useState<Folder[] | null>(null);
  const [folderData, setFolderData] = useState<Folder | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showRenameModal, setShowRenameModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [modalRenameMessage, setRenameModalMessage] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [renameItem, setRenameItem] = useState<string | null>(null);
  const [graphUrl, setGraphUrl] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  
  
  
  const toggleFolder = (folderName: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  const formatDuration = (seconds: number | undefined ) => {
    if (seconds === undefined) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
  
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  function isValidFileName(fileName: string): boolean {
    const pattern = /^[a-zA-Z0-9_\-\.]+$/;
    return pattern.test(fileName) && fileName.length < 80;
  }

  const handleRenameClick = (itemName: string) => {
    setRenameItem(itemName);
    setNewItemName(itemName.split('.').slice(0, -1).join('.'));
    setShowRenameModal(true);
  };

  const handleCancelRename = () => {
    setShowRenameModal(false);
    setRenameItem(null);
    setNewItemName('');
  };
  const handleConfirmRename = async () => {
    if (!isValidFileName(newItemName)) {
      setRenameModalMessage('Invalid file name, please try again.');
      return;
    }

    try {
      const fileExtension = renameItem!.split('.').pop();
      const response = await fetch('http://localhost:5000/files/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemName: renameItem, newItemName: `${newItemName}.${fileExtension}` }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to rename item');
      }

      console.log('Item renamed successfully');
      setShowModal(false);
      setRenameItem(null);
      setNewItemName('');
    } catch (error) {
      console.error('Error renaming item:', error);
    }
    fetchData();
  };


  const handleGraphClick = async (itemName: string) => {
    setIsGenerating(true);
    console.log('Creating graph for:', itemName);
    setSelectedItem(itemName);
    try{
       const response = await fetch('http://localhost:5000/files/graph', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ itemName }),
         credentials: 'include',
         
       });
       const data = await response.json();
        if (response.ok) {
          setGraphUrl(data.image_url);
          setError(null);
        }
       if (!response.ok) {
         throw new Error('Failed to create graph');
        }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setModalMessage(error.response.data.error);
        setShowModal(true);
    } else {
        setModalMessage('An unknown error occurred.');
        setShowModal(true);
        console.log('Error:', error);
    }
    }
    finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadClick = async (fileName: string) => {
    try {
        const response = await fetch(`http://localhost:5000/files/download/${fileName}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to download file');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download error:', error);
        setModalMessage('An error occurred while downloading the file.');
        setShowModal(true);
    }
};

  const handleDeleteClick = (itemName: string) => {
    setShowDeleteModal(true); 
    setDeleteItem(itemName); 
  };  
  const handleDeleteCancel = () => {
    setShowDeleteModal(false); 
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch('http://localhost:5000/files/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deleteItem: deleteItem! }),
        credentials: 'include',
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
  
      console.log('Item deleted successfully');
      fetchData();
      setDeleteItem(null); // Reset deleteItem state
      setShowDeleteModal(false); // Close delete modal
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:5000/files', {
        credentials: 'include',
      });
      const data = await response.json();
      setData(data);
      setFolderData(data as Folder);
      console.log(response);
      console.log('Data:', data);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred.');
      }
      console.error('Error fetching data:', error); 
    }
  };

  

  const renderArrow = (folderName: string) => {
    return expandedFolders[folderName] ? (
      <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6"
    >
      <path d="M19 9L12 16L5 9" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6"
    >
      <path d="M9 5L16 12L9 19" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  };

  

  useEffect(() => {
    fetchData();
  }, []);
  function isFolder(item: Folder | File): item is Folder {
    return item.type === 'folder';
  }
  
  const renderItems = (items: (Folder | File)[]) => {

   if (!data) return null;

    return items.map((item, index) => (
      <React.Fragment key={index}>
        {isFolder(item) ? (
          <>
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <td className="p-4 align-middle w-1/12">
              <button className='flex items-center' onClick={() => toggleFolder(item.name)}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                  >
                  <path d="M3 8.2C3 7.07989 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H9.67452C10.1637 5 10.4083 5 10.6385 5.05526C10.8425 5.10425 11.0376 5.18506 11.2166 5.29472C11.4184 5.4184 11.5914 5.59135 11.9373 5.93726L12.0627 6.06274C12.4086 6.40865 12.5816 6.5816 12.7834 6.70528C12.9624 6.81494 13.1575 6.89575 13.3615 6.94474C13.5917 7 13.8363 7 14.3255 7H17.8C18.9201 7 19.4802 7 19.908 7.21799C20.2843 7.40973 20.5903 7.71569 20.782 8.09202C21 8.51984 21 9.0799 21 10.2V15.8C21 16.9201 21 17.4802 20.782 17.908C20.5903 18.2843 20.2843 18.5903 19.908 18.782C19.4802 19 18.9201 19 17.8 19H6.2C5.07989 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>                  </svg>
                </button>
              </td>
              <td onClick={() => toggleFolder(item.name)}>
                <div className="flex items-center">
                  <span>Your Files</span>
                  <span className="ml-2">{renderArrow(item.name)}</span>
                </div>
              </td>
              <td className="p-4 align-middle">{item.type}</td>
              <td className="p-4 align-middle">-</td>
            </tr>
            {expandedFolders[item.name] && renderItems(item.items)}
          </>
        ) : (
          <tr key={item.name}>
            <td className="p-4 align-middle w-1/12"></td>
            <td className="p-4 align-middle">{item.name}
            {item.metadata && (
              <div className="mt-2">
                <p>Length: {formatDuration(item.metadata?.length)}</p>
                <p>Bitrate: {item.metadata.bitrate?.toString().slice(0,3)} kbps</p>
                <p>Sample Rate: {item.metadata?.sample_rate} Hz</p>
                <p>Channels: {item.metadata?.channels}</p>
                <p>Artist: {item.metadata?.artist}</p>
                <p>Title: {item.metadata?.title}</p>
              </div>
            )}</td>
            {selectedItem === item.name && isGenerating ? (
              <div className='pt-12'>
              <div className="circular-loader"></div>
              </div>
              ) : (
                  selectedItem === item.name && graphUrl && (
                      <div className="graph-container">
                          <img src={graphUrl} alt="Graph" />
                      </div>
                  )
              )}
            <td className="p-4 align-middle ">
              <button className="icon-button" onClick={() => handleDownloadClick(item.name)}>
                <FaDownload className="icon"/>
              </button>
              <button className="icon-button" onClick={() => handleRenameClick(item.name)}>
                <MdDriveFileRenameOutline className="icon"/>
              </button>
              <button className="icon-button" onClick={() => handleGraphClick(item.name)}>
                <MdOutlineGraphicEq className="icon"/>
              </button>
              <button className="icon-button" onClick={() => handleDeleteClick(item.name)}>
                <MdOutlineDelete className="icon"/>
              </button>
            </td>
          </tr>
        )}
      </React.Fragment>
    ));
  };

  if (data === null) {
    return null;
  }

  return (
    <div className='folder-explorer'>
    <div className="space-y-4 m-6 bg-slate-700 rounded-s">
      <div className="space-y-2">
        <label htmlFor="folders" className="text-sm ml-2 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        </label>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm min-w-full">
            <thead>
              <tr className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                <th className="w-1/12"></th>
                <th>Name</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {renderItems(data)}
            </tbody>
          </table>
        </div>
      </div>
      {showRenameModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-gray-800 opacity-50"></div>
          <div className="p-4 bg-zinc-900 w-96 rounded z-50">
            <p>Enter the new name:</p>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="mt-2 p-2 w-full"
            />
            <div className="mt-4 flex justify-center">
              <button onClick={handleConfirmRename} className="mr-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                Confirm
              </button>
              <button onClick={handleCancelRename} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-gray-800 opacity-50"></div>
          <div className="p-4 bg-zinc-900 rounded z-50">
            <p>Are you sure you want to delete "{deleteItem}"?</p>
            <div className="mt-4 flex justify-center">
              <button onClick={handleDeleteConfirm} className="mr-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Yes</button>
              <button onClick={handleDeleteCancel} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">No</button>
            </div>
          </div>
        </div>
      )}
      {showModal && (
        <ErrorModal message={modalMessage} onClose={() => setShowModal(false)} />
      )}
    </div>
  </div>
  );
};

export default FolderExplorer;
