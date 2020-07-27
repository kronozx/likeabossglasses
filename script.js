const video = document.querySelector('#video');
let bossGlasses = null;

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
]).then(startVideo);

async function startVideo() {
    let stream = null;
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            //Make sure to type widht and video here, I spent two days trying to fix a coordinates offset 
            //between the mouth Landmarks coordinates and the Dom body coordinates, and these lines solved my problem:
            video: {
                width: 720,
                height: 560
            }
        });
        video.srcObject = stream;
    } catch (error) {
        console.log(error);
    }
}

video.addEventListener('playing', () => {
    const canvas = faceapi.createCanvasFromMedia(video);   
    document.body.append(canvas);
    
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);
    
    setInterval(async () => {
        const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();    
        if(!detections) {
            return;
        };
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        //finf eyes and eyebrows landmarks
        const leftEye = await detections.landmarks.getLeftEye();
        const rightEye = await detections.landmarks.getRightEye();
        const leftEyeBrow = await detections.landmarks.getLeftEyeBrow();
        const rightEyeBrow = await detections.landmarks.getRightEyeBrow();
                
        if(bossGlasses) {
            console.log('like a boss');
            bossGlasses.remove();
        }
        
        //Calculate Rotation Angle for bossGlasses
        const adjacent = leftEye[0].x - rightEye[3].x;
        const opposite = leftEye[0].y - rightEye[3].y;
        const angleTang = opposite / adjacent;
        const angleDegrees = Math.atan(angleTang) * (180 / Math.PI);

        bossGlasses = document.createElement('img');
        bossGlasses.src = "images/bossglasses.png"; 
        bossGlasses.style.cssText = `
            position: absolute;
            width: calc(${rightEyeBrow[4].x}px - ${leftEyeBrow[0].x}px);
            transform: rotate(${angleDegrees}deg);
            left: ${leftEyeBrow[0].x}px;
            top: ${leftEyeBrow[0].y}px;                   
        `;
        document.body.appendChild(bossGlasses);
        //console.log(bossGlasses);
                   
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        //Comment lines below if you don't want to see face box and face landmarks
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    }, 100);    
});


