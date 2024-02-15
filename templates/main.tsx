import React, { useRef, ChangeEvent } from 'react';

const GraphUploader: React.FC = () => {
    const fileInput = useRef<HTMLInputElement>(null);
    const [imageUrl, setImageUrl] = React.useState<string | null>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {
            const data = new FormData();
            data.append('file', file);

            fetch('/graph', {
                method: 'POST',
                body: data
            })
            .then(response => response.json())
            .then(result => {
                setImageUrl(result.image_url);
            })
            .catch(error => {
                console.error('Error:', error);
            });
        };

        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="background-color: rgb(30, 41, 59); background-image: radial-gradient(at 0% 100%, rgb(23, 23, 23) 0, transparent 100%);">
            <form method="POST" action="/" encType="multipart/form-data">
                <div className="grid place-items-top justify-center">
                    <h1 className="text-blue-600">Uploader</h1>
                </div>
                <div className="grid items-center justify-center py-4">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white" htmlFor="multiple_files">Upload multiple files</label>
                    <input className="block w-96 text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" id="multiple_files" type="file" name="file" accept=".mp3,.flac,.wav,.alac" multiple onChange={handleFileChange} />
                </div>
                <div id="graph" className="flex items-center justify-center">
                    {imageUrl && <img src={imageUrl} alt="Graph" />}
                </div>
                <div className="flex items-center justify-center w-half">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-96 h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {/* SVG icon */}
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">MP3, ALAC, FLAC, WAV</p>
                        </div>
                        <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} />
                        <input type="submit" value="Upload file"/>
                    </label>
                </div>
            </form>
        </div>
    );
}

export default GraphUploader;