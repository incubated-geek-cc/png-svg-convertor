document.addEventListener('DOMContentLoaded', async() => {
    console.log('DOMContentLoaded');

    const millisecondsToDatetimeStr = (milliseconds) => {
        const dateObject = new Date(milliseconds);

        const dateYear=dateObject.getFullYear();
        const dateMonth=(((dateObject.getMonth()+1))<10) ? `0${((dateObject.getMonth()+1))}` : ((dateObject.getMonth()+1));
        const dateDay=((dateObject.getDate())<10) ? `0${(dateObject.getDate())}` : (dateObject.getDate());

        const datetimeHours=(((dateObject.getHours()))<10) ? `0${((dateObject.getHours()))}` : ((dateObject.getHours()));
        const datetimeMinutes=(((dateObject.getMinutes()))<10) ? `0${((dateObject.getMinutes()))}` : ((dateObject.getMinutes()));
        const datetimeSeconds=(((dateObject.getSeconds()))<10) ? `0${((dateObject.getSeconds()))}` : ((dateObject.getSeconds()));

        const datetimeStr=`${dateYear}-${dateMonth}-${dateDay} ${datetimeHours}:${datetimeMinutes}:${datetimeSeconds}`;

        return datetimeStr;
    };

    const byteToKBScale = 0.0009765625;
    const scale = window.devicePixelRatio*2;
    const requiredSize=150;

    const equalAspectRatio=document.querySelector('#equalAspectRatio');
    const previewSVG=document.querySelector('#previewSVG');

    const loadImage = (url) => new Promise((resolve, reject) => {
        const img = new Image(); // alt: document.createElement('img')
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', (err) => reject(err));
        img.src = url;
    });

    var _canvas, _svg, _img, imgH=0, imgW=0, _ZOOM_FACTOR=1.0;

    const resizedImgH=document.querySelector('#resizedImgH');
    const resizedImgW=document.querySelector('#resizedImgW');

    const previewUploadedImage=document.querySelector('#previewUploadedImage');
    const previewUploadedSVG=document.querySelector('#previewUploadedSVG');

    previewUploadedImage['style']['width']=`${previewUploadedImage.clientWidth}px`;
    previewUploadedSVG['style']['width']=`${previewUploadedSVG.clientWidth}px`;

    const saveImageBtn=document.querySelector('#saveImageBtn');
    
    const fileName=document.querySelector('#fileName');
    const fileSize=document.querySelector('#fileSize');
    const imgDimensions=document.querySelector('#imgDimensions');
    const fileType=document.querySelector('#fileType');
    const lastModified=document.querySelector('#lastModified');

    const uploadFile=document.querySelector('#uploadFile');

    const DOMURL = window.URL || window.webkitURL || window;
    const convertBitArrtoB64 = (bitArr) => ( btoa( bitArr.reduce((data, byte) => data + String.fromCharCode(byte), '') ) );

    saveImageBtn.addEventListener('click', (evt)=> {
        let downloadLink=document.createElement('a');
        downloadLink.href=saveImageBtn.value;
        // console.log(saveImageBtn.value);

        let fileExt=(fileName.innerText).substr((fileName.innerText).lastIndexOf('.')+1);
        
        let saveFileName=fileName.innerText.replace(`.${fileExt}`,'');
        downloadLink.download=`${saveFileName}-${resizedImgW.value}x${resizedImgH.value}.${ fileExt=='svg' ? 'png' : 'svg'}`;
        downloadLink.click();
    });

    function readFileAsDataURL(file) {
        return new Promise((resolve,reject) => {
            let fileredr = new FileReader();
            fileredr.onload = () => resolve(fileredr.result);
            fileredr.onerror = () => reject(fileredr);
            fileredr.readAsDataURL(file);
        });
    }

    function readFileAsText(file) {
        return new Promise((resolve,reject) => {
            let fileredr = new FileReader();
            fileredr.onload = () => resolve(fileredr.result);
            fileredr.onerror = () => reject(fileredr);
            fileredr.readAsText(file);
        });
    }

    async function scaleCanvas(_canvas, _img, _ZOOM_FACTOR, imgH, imgW, scale) {
        _canvas['style']['width'] = `${imgW}px`;
        _canvas['style']['height'] = `${imgH}px`;
        _canvas['style']['border'] = '1px dashed #6c757d';
        _canvas['style']['margin'] = '0 auto';
        _canvas['style']['display'] = 'flex';
        let cWidth=_ZOOM_FACTOR*imgW*scale;
        let cHeight=_ZOOM_FACTOR*imgH*scale;

        _canvas.width=cWidth;
        _canvas.height=cHeight;

        resizedImgW.value=parseInt(cWidth);
        resizedImgH.value=parseInt(cHeight);

        _canvas.getContext('2d', { willReadFrequently: true }).scale(scale, scale);
        _canvas.getContext('2d', { willReadFrequently: true }).drawImage(_img, 0, 0, imgW*_ZOOM_FACTOR, imgH*_ZOOM_FACTOR);

        let fileNameL=fileName.innerText.toLowerCase();
        if(fileNameL.endsWith('.svg')) {
            saveImageBtn.value=_canvas.toDataURL();
        } else if(fileNameL.endsWith('.jpg') || fileNameL.endsWith('.jpeg') || fileNameL.endsWith('.png')) {
            let imgData=_canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, cWidth, cHeight);
            let svgstr = ImageTracer.imagedataToSVG(imgData, { scale:1.0 });
            // console.log(svgstr);
            previewUploadedSVG.innerHTML=svgstr;
            let svgData = new Blob([svgstr], {
                type: 'image/svg+xml'
            });
            let buffer=await svgData.arrayBuffer();
            // console.log(buffer);
            svgData=convertBitArrtoB64(new Uint8Array(buffer));
            saveImageBtn.value=`data:image/svg+xml;base64,${svgData}`;
        }
    }
    previewSVG.setAttribute('hidden','');
    previewSVG.addEventListener('click', ()=> {
        let wWidth=_canvas.width;
        let wHeight=_canvas.height;
        let wScrollbars='no';
        if(wHeight-150>window.clientHeight) {
            wScrollbars='yes';
            wHeight=window.clientHeight-150;
            wWidth=(wHeight/_canvas.height)*wWidth;
        }
        if(wWidth-150>window.clientWidth) {
            wScrollbars='yes';
            wWidth=window.clientWidth-150;
        }
        const previewWindow = window.open('', '', `width=${wWidth},height=${wHeight},resizable=no,scrollbars=${wScrollbars},left=${(window.clientWidth-wWidth)/2},top=${(window.clientHeight-wHeight)/2}`); 
        previewWindow.document.write(previewUploadedSVG.innerHTML);
    });
    async function reverseScaleCanvas(_canvas, _img, _ZOOM_FACTOR, cHeight, cWidth, scale) {
        _canvas.width=cWidth;
        _canvas.height=cHeight;

        let imgW=parseFloat(cWidth/_ZOOM_FACTOR)/scale;
        let imgH=parseFloat(cHeight/_ZOOM_FACTOR)/scale;

        _canvas['style']['width'] = `${imgW}px`;
        _canvas['style']['height'] = `${imgH}px`;
        _canvas['style']['border'] = '1px dashed #6c757d';
        _canvas['style']['margin'] = '0 auto';
        _canvas['style']['display'] = 'flex';
        
        _canvas.getContext('2d', { willReadFrequently: true }).scale(scale, scale);
        _canvas.getContext('2d', { willReadFrequently: true }).drawImage(_img, 0, 0, imgW*_ZOOM_FACTOR, imgH*_ZOOM_FACTOR);

        let fileNameL=fileName.innerText.toLowerCase();
        if(fileNameL.endsWith('.svg')) {
            saveImageBtn.value=_canvas.toDataURL();
        } else if(fileNameL.endsWith('.jpg') || fileNameL.endsWith('.jpeg') || fileNameL.endsWith('.png')) {
            let imgData=_canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, cWidth, cHeight);
            let svgstr = ImageTracer.imagedataToSVG(imgData, 'detailed');
            // console.log(svgstr);
            previewUploadedSVG.innerHTML=svgstr;
            let svgData = new Blob([svgstr], {
                type: 'image/svg+xml'
            });
            let buffer=await svgData.arrayBuffer();
            // console.log(buffer);
            svgData=convertBitArrtoB64(new Uint8Array(buffer));
            saveImageBtn.value=`data:image/svg+xml;base64,${svgData}`;
        }
    }
    
    resizedImgW.addEventListener('change', (evtW)=> {
        let cWidth=evtW.target.valueAsNumber;
        let cHeight=resizedImgH.valueAsNumber;
        if(equalAspectRatio.checked) {
            cHeight=parseFloat(cWidth/_canvas.width)*_canvas.height;
            resizedImgH.value=Math.round(cHeight);
        }
        reverseScaleCanvas(_canvas, _img, _ZOOM_FACTOR, cHeight, cWidth, scale);
    });
    resizedImgH.addEventListener('change', (evtH)=> {
        let cHeight=evtH.target.valueAsNumber;
        let cWidth=resizedImgW.valueAsNumber;
        if(equalAspectRatio.checked) {
            cWidth=parseFloat(cHeight/_canvas.height)*_canvas.width;
            resizedImgW.value=Math.round(cWidth);
        }
        reverseScaleCanvas(_canvas, _img, _ZOOM_FACTOR, cHeight, cWidth, scale);
    });

    equalAspectRatio.addEventListener('click', async(evt)=> {
        if(equalAspectRatio.checked) {
            let cWidth=resizedImgW.valueAsNumber;
            let cHeight=parseFloat(cWidth/_img.naturalWidth)*_img.naturalHeight;
            resizedImgH.value=Math.round(cHeight);
            reverseScaleCanvas(_canvas, _img, _ZOOM_FACTOR, cHeight, cWidth, scale);
        }
    });

    function triggerEvent(el, type) {
        let e = (('createEvent' in document) ? document.createEvent('HTMLEvents') : document.createEventObject());
        if ('createEvent' in document) {
            e.initEvent(type, false, true);
            el.dispatchEvent(e);
        } else {
            e.eventType = type;
            el.fireEvent(`on${e.eventType}`, e);
        }
    }

    uploadFile.addEventListener('click', (evt)=> {
        evt.currentTarget.value='';
    });

    uploadFile.addEventListener('change', async(evt) => {
        let file = evt.currentTarget.files[0];
        if(!file) return;

        fileName.innerHTML=file.name;
        fileSize.innerHTML=`${(parseFloat(file.size) * byteToKBScale).toFixed(2)} 𝙺𝙱`;
        fileType.innerHTML=file.type;
        lastModified.innerHTML=millisecondsToDatetimeStr(file.lastModified);

        let fileNameL=fileName.innerText.toLowerCase();
        var b64str='';
        if(fileNameL.endsWith('.svg')) {
            let svgstr = await readFileAsText(file);
            // console.log(svgstr);
            previewUploadedSVG.innerHTML=svgstr;
            let svgData = new Blob([svgstr], {
                type: 'image/svg+xml'
            });
            b64str = DOMURL.createObjectURL(svgData);
        } else if(fileNameL.endsWith('.jpg') || fileNameL.endsWith('.jpeg') || fileNameL.endsWith('.png')) {
            b64str = await readFileAsDataURL(file);
        }
        _img = await loadImage(b64str);
        previewSVG.removeAttribute('hidden');
        // set sizes in memory
        imgH=_img.naturalHeight;
        imgW=_img.naturalWidth;
        imgDimensions.innerHTML=`${imgW}px × ${imgH}px`;

        _img['style']['height']=`${imgH}px`;
        _img['style']['width']=`${imgW}px`;

        _canvas=document.createElement('canvas');
        scaleCanvas(_canvas, _img, _ZOOM_FACTOR,imgH, imgW, scale);
        previewUploadedImage.appendChild(_img);

        // display size
        const sizeBenchmark = Math.min(imgW, imgH);
        _ZOOM_FACTOR=requiredSize/parseFloat(sizeBenchmark);

        let displayedHeight=Math.round(_ZOOM_FACTOR*imgH);
        let displayedWidth=Math.round(_ZOOM_FACTOR*imgW);

        _img['style']['height']=`${displayedHeight}px`;
        _img['style']['width']=`${displayedWidth}px`;
        scaleCanvas(_canvas, _img, _ZOOM_FACTOR, displayedHeight, displayedWidth, scale);

        resizedImgW.value = imgW;
        triggerEvent(resizedImgW, 'change');
    });
});