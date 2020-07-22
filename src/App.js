import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import * as faceapi from 'face-api.js';

function App() {
    // STATE
    const [mode, setMode] = useState(0)
    const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&dl=naassom-azevedo-Q_Sei-TqSlc-unsplash.jpg")
    const [videoDetectionInterval, setDetectionInterval] = useState(null)
    const [showAgeGender, setShowAgeGender] = useState(false)
    const [showCurrExpression, setShowCurrExpress] = useState(false)

    // METHODS
    async function detectFace() {
        try {
            // LOAD MODELS
            await faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/models')
            await faceapi.nets.faceExpressionNet.loadFromUri('/assets/models')
            await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models')
            await faceapi.nets.ageGenderNet.loadFromUri('/assets/models')

            // GET REFERENCE OF MEDIA
            const input = document.getElementById(mode == 0 ? 'myImg' : 'video')

            // GET MEDIA DIMENSIONS
            const displaySize = { width: input.width, height: input.height }

            // GET ALREADY ADDED CANVAS TO SHOW DETECTIONS
            const canvas = document.getElementById('overlay')

            // DETECT FACES
            const detections = await faceapi.detectAllFaces(input).withFaceLandmarks().withFaceExpressions().withAgeAndGender()

            // RESIZE DETECTIONS TO MATCH IMAGE DIMENSIONS
            const resizedDetections = faceapi.resizeResults(detections, displaySize)

            // RESIZE CANVAS TO MATCH IMAGE DIMENSIONS
            faceapi.matchDimensions(canvas, displaySize)

            // CLEAR CANVAS BEFORE RENDERING RECTANGLE
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)

            // DRAW THE DETECTIONS
            faceapi.draw.drawDetections(canvas, resizedDetections)
            if (showCurrExpression) {
                faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
            }
            if (showAgeGender) {
                resizedDetections.forEach(detection => {
                    const box = detection.detection.box
                    const drawBox = new faceapi.draw.DrawBox(box, { label: Math.round(detection.age) + " year old\n" + detection.gender })
                    drawBox.draw(canvas)
                })


            }
        }
        catch (err) {
            console.error(err)
        }
    }

    const onImageChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            setImageUrl(URL.createObjectURL(event.target.files[0]))
        }
    }

    const startVideo = () => {
        try {
            const video = document.getElementById('video')
            navigator.getUserMedia(
                { video: true },
                stream => video.srcObject = stream,
                err => console.error(err)
            )
            video.addEventListener('play', () => {
                let detectionInterval = setInterval(() => {
                    console.log('Tracking face in video')
                    detectFace()
                }, 100)
                setDetectionInterval(detectionInterval)
            })
        }
        catch (err) {
            console.error(err)
        }
    }

    const stopVideo = () => {
        try {
            const video = document.getElementById('video')
            var stream = video.srcObject;
            var tracks = stream.getTracks();
            for (var i = 0; i < tracks.length; i++) {
                var track = tracks[i];
                track.stop();
            }
            video.srcObject = null;
        }
        catch (err) {
            console.error(err)
        }
    }

    const changeMode = (newMode) => {
        if (newMode == 0) {
            clearInterval(videoDetectionInterval);
            stopVideo()
        }
        setMode(newMode)
    }

    // EFFECTS
    useEffect(() => {
        detectFace()
    }, [imageUrl, showAgeGender, showCurrExpression])

    useEffect(() => {
        if (mode == 0) {
            detectFace()
        }
        else {
            startVideo()
        }
    }, [mode])

    return (
        <div className="App">
            <header className="App-header">
                <div className="media-container">
                    {mode == 0 &&
                        <img id="myImg" height={800} src={imageUrl} crossOrigin="anonymous" />
                    }
                    {mode == 1 &&
                        <video id="video" width="720" height="560" autoPlay muted />
                    }
                    <canvas id="overlay" />
                </div>
                <div>
                    <div className="controls-container">
                        <input type="radio" id="female" name="gender" defaultValue="female" checked={mode == 1 ? true : false} onClick={() => changeMode(1)} />
                        <label htmlFor="female" onClick={() => changeMode(1)}>Webcam</label><br />
                        <input type="radio" id="male" name="gender" defaultValue="male" checked={mode == 0 ? true : false} onClick={() => changeMode(0)} />
                        <label htmlFor="male" onClick={() => changeMode(0)}>Static Image</label><br />
                        {mode == 0 &&
                            <input type="file" onChange={onImageChange} />
                        }
                    </div>
                    <div className="controls-container mt-0">
                        <input type="checkbox" id="ageGender" name="ageGender" checked={showAgeGender} onClick={() => setShowAgeGender(!showAgeGender)} />
                        <label onClick={() => setShowAgeGender(!showAgeGender)}>Show age and gender</label><br />
                        <input type="checkbox" id="expression" name="expression" checked={showCurrExpression} onClick={() => setShowCurrExpress(!showCurrExpression)} />
                        <label onClick={() => setShowCurrExpress(!showCurrExpression)}>Show current expression</label><br />
                    </div>
                </div>
            </header>
        </div>
    );
}

export default App;
