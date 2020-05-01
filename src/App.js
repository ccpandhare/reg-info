import React, { useState, useCallback, useEffect } from "react";
import "./App.css";
import _data from "./data";

function App() {
  const [data, setData] = useState(_data);
  const regList = Object.keys(data);
  const [reg, setReg] = useState(regList[0]);
  const [selBit, setSelBit] = useState(null);
  const regData = data[reg];

  useEffect(() => {
    if(!selBit) return;
    setSelBit(regData.bits[selBit.index]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    setSelBit(null);
  }, [reg])

  const handleKeyDown = useCallback((e) => {
      switch (e.key) {
        case "l":
        case "h":
        case "o":
          setSelBit(getNextBit(regData.bits, e.key, selBit && selBit.index));
          break;
        case "j":
        case "k":
          setReg(getNextReg(regList, e.key, regList.indexOf(reg)))
          break;
        case " ":
          if (!selBit) return;
          setData((currentData) => {
            const copy = deepCopyObject(currentData);
            copy[reg].bits[selBit.index].value = getNextValue(selBit.value);
            return copy;
          });
          break;
        default:
      }
    },
    [setReg, setSelBit, setData, regData, regList, selBit, reg]
  );

  document.onkeydown = handleKeyDown;

  return (
    <div className="App">
      <div id="Header">
        $ RegInfo
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
        <div id="RegSection">
          <p id="RegName" onClick={_ => setSelBit(null)}>{regData.name || "No Name"}</p>
          <div id="Bits" style={{'--cols': regData.bits.length}}>
              {regData.bits.map((b) => (
                <BitInfo bit={b} property="index" setSelBit={setSelBit} />
              ))}
              {regData.bits.map((b) => (
                <BitInfo selBit={selBit} bit={b} property="value" setSelBit={setSelBit} />
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
                getLines(selBit ? (selBit.info[selBit.value] || selBit.info.join('\n')) : regData.info).map(l => <p>{l}</p>)
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BitInfo({bit, selBit, property, setSelBit}) {
  const isSelected = selBit ? selBit.index === bit.index : false;
  return (
    <label
      className={`bitInfo ${property} ${isSelected && 'selected'}`}
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
  return text.split("\n");
}

function getNextBit(bits, pressedKey, currentIndex) {
  let nextIndex;
  switch (pressedKey) {
    case 'l':
      if (currentIndex == null) currentIndex = -1;
      nextIndex = currentIndex + 1 < bits.length ? currentIndex + 1 : 0;
      console.log(nextIndex)
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
