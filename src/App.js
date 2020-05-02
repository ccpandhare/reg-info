import React, { useState, useCallback, useEffect, useRef } from "react";
import "./App.css";
import download from 'js-file-download';
import _data from "./data";

function App() {
  const [data, setData] = useState(_data);
  const regList = Object.keys(data);
  const [reg, setReg] = useState(regList[0]);
  const [selBit, setSelBit] = useState(null);
  const [isSummaryMode, setSummaryMode] = useState(false);
  const [multiSelected, setMultiSelected] = useState([]);
  const regData = data[reg];
  const [info, setInfo] = useState(regData ? regData.info : null);

  useEffect(() => {
    if (regData && multiSelected.length !== 0) {
      setInfo(regData.bits.filter(b => multiSelected.indexOf(b.index) !== -1).map(b => `bit ${b.index}: ${getInfo(b)}`))
    } else {
      if (!selBit) {
        setInfo(regData ? regData.info : '')
      } else if (selBit) {
        setInfo(getInfo(selBit));
      }
    }
  }, [selBit, multiSelected]);

  useEffect(() => {
    if(selBit && regData)
      setSelBit(regData.bits[selBit.index]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    setSelBit(null);
    setMultiSelected([]);
  }, [reg])

  const handleKeyDown = useCallback((e) => {
      switch (e.key) {
        case "l":
        case "h":
        case "o":
          if(!regData || regData.type === "image")
            break;
          setSummaryMode(false);
          setSelBit(getNextBit(regData.bits, e.key, selBit && selBit.index));
          break;
        case "j":
        case "k":
          setSummaryMode(false);
          setReg(getNextReg(regList, e.key, regList.indexOf(reg)))
          break;
        case " ":
          setSummaryMode(false);
          if (!selBit) return;
          setData((currentData) => {
            const copy = deepCopyObject(currentData);
            copy[reg].bits[selBit.index].value = getNextValue(selBit.value);
            return copy;
          });
          break;
        case "s":
          if(!regData || regData.type === "image")
            break;
          if (isSummaryMode) {
            setSummaryMode(false);
            setInfo(selBit ? getInfo(selBit) : (regData ? regData.info : ''))
          } else {
            setSummaryMode(true);
            if(regData) setInfo(regData.bits.map(b => `${b.index}: ${getInfo(b)}`))
          }
          break;
        case "m":
          if (selBit) {
            if (multiSelected.indexOf(selBit.index) !== -1) {
              setMultiSelected(m => m.filter(m => m !== selBit.index))
            } else {
              setMultiSelected(m => [...m, selBit.index]);
            }
          }
          break;
        case "M":
          setMultiSelected([]);
          break;
        default:
      }
    },
    [setReg, setSelBit, setData, regData, regList, selBit, reg]
  );

  document.onkeydown = handleKeyDown;

  return regData ? (
    <div className="App">
      <div id="Header">
        $ RegInfo
        <div id="Buttons">
          <DownloadJSON data={data} />
          <LoadJSON setData={setData} setReg={setReg} />
        </div>
      </div>
      <div id="Content">
        <div id="LeftSection">
          {regList.map((k) => (
            <p
              className={`regLink ${k === reg && "selected"}`}
              onClick={(_) => setReg(k)}
            >
              {k}
            </p>
          ))}
        </div>
        <div id="RegSection" className={isSummaryMode && 'summary'}>
        {
          regData.type === "image"
          ? <Image location={regData.location} />
          : (
          <>
          <p id="RegName" onClick={_ => setSelBit(null)}>{regData.name || "No Name"}</p>
          <div id="Bits" style={{'--cols': regData.bits.length}}>
              {regData.bits.map((b) => (
                <BitInfo bit={b} property="index" setSelBit={setSelBit} />
              ))}
              {regData.bits.map((b) => (
                <BitInfo selBit={selBit} bit={b} property="value" setSelBit={setSelBit} multiSelected={multiSelected.indexOf(b.index) !== -1} />
              ))}
              {regData.bits.map((b) => (
                <BitInfo bit={b} property="name" setSelBit={setSelBit} />
              ))}
              {regData.bits.map((b) => (
                <BitInfo bit={b} property="permissions" setSelBit={setSelBit} />
              ))}
          </div>
          <div id="Info">
            <div>
              {
                getLines(info).map(l => <p>{l}</p>)
              }
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  ) : <div>Loading...</div>;
}

function Image({location}) {
  return <div className="image" style={{backgroundImage: `url(${location})`}} />
}

function DownloadJSON({data}) {
  const downloadFile = _ => {
    download(JSON.stringify(data, null, 2), 'data.json');
  }
  useEffect(() => {
    const detectD = e => {
      if(e.key === 'd') {
        downloadFile();
      }
    }
    document.addEventListener("keyup", detectD);
    return _ => {
      document.removeEventListener("keyup", detectD);
    }
  })
  return (
    <div id="DownloadJSON">
      <button onClick={downloadFile}>$ Download JSON</button>
    </div>
  )
}

function LoadJSON({setData, setReg}) {
  const fileInput = useRef();
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const handleFileInputChange = _ => {
    setFile(null);
    setError(null);
    const _file = fileInput.current.files[0];
    const isValid = validateFile(_file);
    if(isValid) {
      setFile(_file);
      _file.text().then(data => {
        const json = JSON.parse(data);
        setData(json);
        setReg(Object.keys(json)[0])
      }).catch(err => setError(String(err)));
    } else {
      setError("Invalid File");
    }
  }
  useEffect(() => {
    const detectU = e => {
      if(e.key === 'u') {
        fileInput.current.click();
      }
    }
    document.addEventListener("keyup", detectU);
    return _ => {
      document.removeEventListener("keyup", detectU);
    }
  })
  const validateFile = file => {
    return !!file.name.match(/.json$/i);
  }
  return (
    <div id="LoadJSON">
      <button onClick={_ => fileInput.current.click()}>$ Load JSON</button>
      <input type="file" ref={fileInput} onChange={handleFileInputChange} />
      {error ? <label className="error">{error}</label> : file && <label>{file.name}</label>}
    </div>
  );
}

function getInfo({info: infoArray, value}) {
  if (value === '1' || value === '0') {
    return infoArray[value];
  }
  return infoArray.map(i => `${infoArray.indexOf(i)}: ${i}`);
}

function BitInfo({bit, selBit, property, setSelBit, multiSelected}) {
  const isSelected = selBit ? selBit.index === bit.index : false;
  return (
    <label
      className={`bitInfo ${property} ${isSelected && 'selected'} ${multiSelected && 'multiSelected'}`}
      onClick={_ => setSelBit(bit)}>
      {bit[property]}
    </label>
  )
}

function getNextValue(currentValue) {
  switch (currentValue) {
    case 'x':
      return '0';
    case '0':
      return '1';
    case '1':
    default:
      return 'x';
  }
}

function deepCopyObject(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getLines(text) {
  if (Array.isArray(text)) return text;
  if (typeof text !== 'string') return [''];
  return text.split("\n");
}

function getNextBit(bits, pressedKey, currentIndex) {
  let nextIndex;
  if (!bits) return;
  switch (pressedKey) {
    case 'l':
      if (currentIndex == null) currentIndex = -1;
      nextIndex = currentIndex + 1 < bits.length ? currentIndex + 1 : 0;
      return bits[nextIndex];
    case 'h':
      if (currentIndex == null) currentIndex = 0;
      nextIndex = currentIndex === 0 ? bits.length - 1 : currentIndex - 1;
      return bits[nextIndex];
    case 'o':
      return null;
    default:
  }
}

function getNextReg(regList, pressedKey, currentRegIndex) {
  switch (pressedKey) {
    case 'j':
      return regList[(currentRegIndex + 1) % regList.length]
    case 'k':
      return regList[(currentRegIndex - 1 + regList.length) % regList.length]
    default:
  }
}

export default App;
