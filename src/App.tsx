import { useState, useEffect, useRef, ChangeEvent } from 'react';
import './App.css'

interface ImageFile extends File {
  customMetadata?: string;
}

const App: React.FC = () => {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [textEntry, setTextEntry] = useState<string>('');
  const [rotation, setRotation] = useState<number>(0);
  const [addXXX, setAddXXX] = useState<boolean>(false);
  const [confidence, setConfidence] = useState<string>('');
  const [directory, setDirectory] = useState<FileList | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (directory) {
      const files = Array.from(directory).filter((file) =>
        /\.(png|jpe?g|gif|bmp|tiff)$/i.test(file.name)
      ) as ImageFile[];
      setImageFiles(files);
      setCurrentIndex(0);
    }
  }, [directory]);

  useEffect(() => {
    if (imageFiles.length > 0) {
      const fileName = imageFiles[currentIndex]?.name.split('.')[0] || '';

      const parts = fileName.split('_');
  
      let textPart = '';
      let rotationPart = '0';
      let confidencePart = '';
  
      if (parts.length === 3) {
        // Case: filename, degree, confidence (no XXX)
        textPart = parts[0]; // Filename
        rotationPart = parts[1]; // Degree
        confidencePart = parts[2]; // Confidence
      } else if (parts.length === 4) {
        // Case: filename, XXX, degree, confidence
        textPart = parts[0] + ' XXX'; // Filename with XXX
        rotationPart = parts[2]; // Degree
        confidencePart = parts[3]; // Confidence
      } else if (parts.length === 2) {
        // Case: filename, confidence (only)
        textPart = parts[0]; // Filename
        confidencePart = parts[1]; // Confidence
      }

      if (rotationPart !== '0') {
        textPart += ` ${rotationPart}`;
      }

      setTextEntry(textPart.trim());
      setAddXXX(textPart.includes('XXX'));
      setConfidence(confidencePart);
      setRotation(parseInt(rotationPart) || 0);

    }
  }, [currentIndex, imageFiles]);
  

  const handleNextImage = () => {
    if (currentIndex < imageFiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAddXXX(false);
    } else {
      alert('You are already on the last image.');
    }
  };

  const handlePrevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setAddXXX(false);
    }
  };

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setTextEntry(newText);
    updateFileName(newText, rotation);
  };

  const handleRotationChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newRotation = parseInt(e.target.value);
    setRotation(newRotation);
  
    // Split the textEntry into parts
    const currentParts = textEntry.split(' ');
  
    let baseName = '';

    if (currentParts.length > 0) {
      baseName = currentParts[0]; // Assume the base name is the first part
  
      // If 'XXX' is part of the name, handle it
      if (currentParts.length > 1) {
        if (currentParts[1] === 'XXX') {
          baseName = `${baseName} XXX`;
        }
      }
    }
  
    // Construct the new file name with the new rotation value
    const newFileName = `${baseName.trim()}${newRotation > 0 ? ` ${newRotation}` : ''} ${confidence}.png`;
  
    // Call updateFileName and update textEntry with the new file name
    updateFileName(baseName, newRotation);
    setTextEntry(newFileName);
  };
  
  
  const handleAddXXXChange = () => {
    setAddXXX((prevAddXXX) => {
      const newAddXXX = !prevAddXXX;
      
      const parts = textEntry.split(' ');
  
      let newText: string;

      if (parts.length > 1 && !isNaN(parseInt(parts[parts.length - 1]))) {
        parts.pop()
      }
  
      if (newAddXXX) {
        if (!parts.includes('XXX')) {
          newText = `${parts.join(' ')} XXX`.trim();
        } 
        else {
          newText = parts.join(' ').trim();
        }
      } 
      else {
        newText = parts.filter(part => part !== 'XXX').join(' ').trim();
      }

      setTextEntry(newText);
      updateFileName(newText, rotation);
  
      return newAddXXX;
    });
  };
  

  const loadDirectory = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setDirectory(e.target.files);
  };

  const updateFileName = (newText: string, rotationValue: number) => {
    const updatedFiles = [...imageFiles];
    const currentFile = updatedFiles[currentIndex];
  
    let newFileName = newText;
  
    const currentParts = newText.split(' '); // Split the newText into parts
  
    if (currentParts.length === 1) {
      // Only the name is present, append rotation if it's greater than 0
      if (rotationValue > 0) {
        newFileName += ` ${rotationValue}`;
      }
    } 
    else if (currentParts.length === 2) {
      // Check if it's either "name XXX" or "name degree"
      if (currentParts[1] === 'XXX') {
        // Name followed by "XXX", append rotation if greater than 0
        if (rotationValue > 0) {
          newFileName += ` ${rotationValue}`;
        }
      } 
      else {
        // Assume it's "name degree", replace the degree with the rotation value
        if (rotationValue > 0) {
          newFileName = `${currentParts[0]} ${rotationValue}`;
        }
      }
    } 
    else if (currentParts.length === 3) {
      // Name, "XXX", and degree are all present
      newFileName = `${currentParts[0]} ${currentParts[1]}`;
      if (rotationValue > 0) {
        newFileName += ` ${rotationValue}`;
      } 
      else {
        newFileName += ` ${currentParts[2]}`;
      }
    }
  
    newFileName += ` ${confidence}.png`; // Add confidence at the end
  
    // Replace all whitespace with underscores
    newFileName = newFileName.replace(/\s+/g, '_'); // Replace whitespace with underscores
  
    const newFile = new File([currentFile], newFileName, { type: currentFile.type });
  
    updatedFiles[currentIndex] = newFile;
    setImageFiles(updatedFiles);
  };
  
  

  const downloadFiles = () => {
    if (textEntry.trim()) {
      imageFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    } 
    else {
      alert('Text cannot be empty.');
    }
  };
  
  const renderImage = () => {
    if (imageFiles.length > 0 && imageFiles[currentIndex]) {
      const imgURL = URL.createObjectURL(imageFiles[currentIndex]);
      return (
        <div className="image-preview">
          <img
            src={imgURL}
            alt="current"
            style={{
              transform: `rotate(${rotation}deg)`,
              maxWidth: '800px',
              maxHeight: '300px',
            }}
          />
        </div>
      );
    }
    return <p>No Image Available</p>;
  };

  return (
    <div className="image-editor">
      <h1>Editor</h1>

      {renderImage()}
      
      <div className="upload-folder-container">
        <input
          type="file"
          multiple
          accept=".png, .jpg, .jpeg, .gif, .bmp, .tiff"
          {...{ directory: '', webkitdirectory: '' }} 
          onChange={loadDirectory}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="custom-file-upload"
        >
          Upload Folder
        </button>
      </div>

      <hr className="divider" />

      <div className="controls">
        <input
          type="text"
          value={textEntry}
          onChange={handleTextChange}
          placeholder="Enter text"
        />

        <label className="confidence-label">Confidence: {confidence}%</label>

        <label className="add-xxx-label">
          Add XXX
          <input
            type="checkbox"
            checked={addXXX}
            className="checkbox-input"
          />
          <span className="custom-checkbox" onClick={handleAddXXXChange}></span>
        </label>


        <label className="rotation-label">
          Rotation
          <select value={rotation} onChange={handleRotationChange} className="rotation-select">
            <option value="0">0</option>
            <option value="90">90</option>
            <option value="180">180</option>
            <option value="360">360</option>
          </select>
        </label>

        <div className="nav-buttons">
          <button onClick={handlePrevImage}>Previous</button>
          <button onClick={handleNextImage}>Next</button>
        </div>

        <hr className="divider" />

        <button className="download-button" onClick={downloadFiles}>Download Files</button>
      </div>
    </div>
  );
};

export default App;