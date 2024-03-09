import React, { useState, useEffect, FC } from 'react';
import './FolderExplorer.css';

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
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const response = await fetch('http://localhost:5000/files', {
  //         credentials: 'include',
  //       });
  //       const data = await response.json();
  //       setData(data);
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //     }
  //   fetchData();
  //   }
  // }, [data]);
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
  
  const handleRenameClick = (itemName: string) => {
    console.log("Renaming:", itemName);
    // Add your logic for renaming here
  };

  const handleDeleteClick = (itemName: string) => {
    setDeleteItem(itemName); // Set the item to delete
    setShowModal(true); // Show the modal
  };

  const handleDeleteConfirm = () => {
    console.log("Deleting:", deleteItem);
    setDeleteItem(null);
    setShowModal(false);
  };

  const handleDeleteCancel = () => {
    setDeleteItem(null);
    setShowModal(false);
  };

  const handleGraphClick = (itemName: string) => {
    console.log("Deleting:", itemName);
    // Add your logic for deleting here
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
            <td className="p-4 align-middle">{item.type}</td>
            <td className="p-4 align-middle">
              <button onClick={() => handleRenameClick(item.name)}>
                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.2799 6.40005L11.7399 15.94C10.7899 16.89 7.96987 17.33 7.33987 16.7C6.70987 16.07 7.13987 13.25 8.08987 12.3L17.6399 2.75002C17.8754 2.49308 18.1605 2.28654 18.4781 2.14284C18.7956 1.99914 19.139 1.92124 19.4875 1.9139C19.8359 1.90657 20.1823 1.96991 20.5056 2.10012C20.8289 2.23033 21.1225 2.42473 21.3686 2.67153C21.6147 2.91833 21.8083 3.21243 21.9376 3.53609C22.0669 3.85976 22.1294 4.20626 22.1211 4.55471C22.1128 4.90316 22.0339 5.24635 21.8894 5.5635C21.7448 5.88065 21.5375 6.16524 21.2799 6.40005V6.40005Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M11 4H6C4.93913 4 3.92178 4.42142 3.17163 5.17157C2.42149 5.92172 2 6.93913 2 8V18C2 19.0609 2.42149 20.0783 3.17163 20.8284C3.92178 21.5786 4.93913 22 6 22H17C19.21 22 20 20.2 20 18V13" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button onClick={() => handleGraphClick(item.name)}>
                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 14L8.79689 11.8437C9.50894 10.9893 9.86496 10.562 10.3333 10.562C10.8017 10.562 11.1577 10.9893 11.8698 11.8437L12.1302 12.1563C12.8423 13.0107 13.1983 13.438 13.6667 13.438C14.135 13.438 14.4911 13.0107 15.2031 12.1563L17 10" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C21.5093 4.43821 21.8356 5.80655 21.9449 8" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <button onClick={() => handleDeleteClick(item.name)}>
                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.5 3H12H8C6.34315 3 5 4.34315 5 6V18C5 19.6569 6.34315 21 8 21H11M13.5 3L19 8.625M13.5 3V7.625C13.5 8.17728 13.9477 8.625 14.5 8.625H19M19 8.625V11.8125" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15 16L17.5 18.5M20 21L17.5 18.5M17.5 18.5L20 16M17.5 18.5L15 21" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </td>
          </tr>
        )}
      </React.Fragment>
    ));
  };

  if (data === null) {
    return null; // Render nothing when data is null
  }

  return (
    <div className='folder-explorer'>
    <div className="space-y-4 m-6 bg-slate-700 rounded-s">
      <div className="space-y-2">
        <label htmlFor="folders" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Folders
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
      {showModal && (
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
    </div>
  </div>
  );
};

export default FolderExplorer;


// const jsonData: Folder[] = [
//   { "name": "Photos", "type": "folder", "items": [ 
//       { "name": "Photo1.jpg", "type": "file" },
//       { "name": "Photo2.jpg", "type": "file" },
//       { "name": "Documents", "type": "folder", "items": [] }
//     ]
//   }
// ];
