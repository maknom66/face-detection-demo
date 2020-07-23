import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import * as faceapi from 'face-api.js';

function App() {
    // STATE
    const [mode, setMode] = useState(0)
    const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&dl=naassom-azevedo-Q_Sei-TqSlc-unsplash.jpg")
    const [videoDetectionInterval, setDetectionInterval] = useState(null)
    const [videoDims, setVideoDims] = useState(null)
    const [showAgeGender, setShowAgeGender] = useState(false)
    const [showCurrExpression, setShowCurrExpress] = useState(false)
    const [mediaDevices, setMediaDevices] = useState([])

    // METHODS
    async function detectFace() {
        try {
            // LOAD MODELS
            await faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/models')
            // await faceapi.nets.faceExpressionNet.loadFromUri('/assets/models')
            // await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models')
            // await faceapi.nets.ageGenderNet.loadFromUri('/assets/models')

            // GET REFERENCE OF MEDIA
            const input = document.getElementById(mode == 0 ? 'myImg' : 'video')

            // GET MEDIA DIMENSIONS
            let displaySize = {}
            if (mode == 0) {
                displaySize = { width: input.width, height: input.height }
            }
            else if (mode == 1) {
                let videoDimRatio = videoDims.width / videoDims.height
                displaySize = { width: input.width, height: input.width / videoDimRatio }
            }

            // GET ALREADY ADDED CANVAS TO SHOW DETECTIONS
            const canvas = document.getElementById('overlay')

            // DETECT FACES
            const detections = await faceapi.detectAllFaces(input)
            // const detections = await faceapi.detectAllFaces(input).withFaceLandmarks().withFaceExpressions().withAgeAndGender()

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

    const stopMediaTracks = (stream) => {
        stream.getTracks().forEach(track => {
            track.stop();
        });
    }

    const startVideo = async () => {
        try {
            let currentStream;
            const video = document.getElementById('video')
            const select = document.getElementById('select');

            if (typeof currentStream !== 'undefined') {
                stopMediaTracks(currentStream);
            }
            const videoConstraints = {};
            if (select.value === '') {
                videoConstraints.facingMode = 'environment';
            } else {
                videoConstraints.deviceId = { exact: select.value };
            }
            const constraints = {
                video: videoConstraints,
                audio: false
            };

            navigator.mediaDevices
                .getUserMedia(constraints)
                .then(stream => {
                    currentStream = stream;
                    video.srcObject = stream;
                    let { width, height } = stream.getTracks()[0].getSettings();
                    setVideoDims({ width, height })
                    return navigator.mediaDevices.enumerateDevices();
                })
                .then(devices => {
                    setMediaDevices(devices)
                })
                .catch(error => {
                    console.error(error);
                });
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

    useEffect(() => {
        if (videoDims) {
            const video = document.getElementById('video')
            video.addEventListener('play', () => {
                let detectionInterval = setInterval(() => {
                    console.log('Tracking face in video')
                    detectFace()
                }, 100)
                setDetectionInterval(detectionInterval)
            })
        }
    }, [videoDims])

    return (
        <div className="App">
            <header className="App-header">
                {mode == 0 &&
                    <div className="row child-hori-center">
                        <div className="col-md-4 col-12" >
                            <div className="p-rel">
                                {mode == 0 &&
                                    <img id="myImg" width={'100%'} src={imageUrl} crossOrigin="anonymous" />
                                }
                                <canvas id="overlay" style={{ top: '0px', left: '0px' }} />
                            </div>
                        </div>
                    </div>
                }
                {mode == 1 &&
                    <div className="p-rel">
                        {/* <video id="video"  autoPlay playsinline></video> */}
                        <video id="video" width={`${window.screen.width >= 768 ? (window.screen.width / 100) * 30 : window.screen.width}px`} height={`${(window.screen.height / 100) * 60}px`} autoplay="" playsinline=""></video>
                        <canvas id="overlay" style={{ top: '50%', left: '0px', right: '0px', bottom: '0px', transform: 'translateY(-50%)' }} />
                    </div>
                }
                <div>
                    <div className="row mt-3 ml-0">
                        <div className="col-md-3 col-12 pr-0">
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="detectionOptions" id="webcam" defaultValue="option1" checked={mode == 1 ? true : false} onClick={() => changeMode(1)} />
                                <label className="form-check-label" htmlFor="webcam">
                                    Webcam
                                </label>
                            </div>
                        </div>
                        {mode == 1 &&
                            <>
                                <div className="col-12 pr-0">
                                    <label className="form-check-label" htmlFor="select">
                                        Select Available Camera
                                </label>
                                </div>
                                <div className="col-md-2 col-12">
                                    <select id="select" className="select" onChange={() => startVideo()}>
                                        <option></option>
                                        {
                                            mediaDevices.map((item, index) => {
                                                if (item.kind == 'videoinput') {
                                                    return (
                                                        <option value={item.deviceId}>{item.label || `Camera ${index + 1}`}</option>
                                                    )
                                                }
                                            })
                                        }
                                    </select>
                                </div>
                            </>
                        }
                        <div className="col-12 pr-0 mt-10">
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="detectionOptions" id="staticImage" defaultValue="option1" checked={mode == 0 ? true : false} onClick={() => changeMode(0)} />
                                <label className="form-check-label" htmlFor="staticImage">
                                    Static Image
                                </label>
                            </div>
                        </div>
                        {mode == 0 &&
                            <div className="col-12 pr-0">
                                <input type="file" onChange={onImageChange} />
                            </div>
                        }
                    </div>
                    {/* <div className="row mt-2 ml-0">
                        <div className="col-md-5 col-12 pr-0">
                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" id="ageGender" checked={showAgeGender} onClick={() => setShowAgeGender(!showAgeGender)} />
                                <label className="form-check-label" htmlFor="ageGender">
                                    Show age and gender
                                </label>
                            </div>
                        </div>
                        <div className="col-md-5 col-12 pr-0">
                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" id="expression" checked={showCurrExpression} onClick={() => setShowCurrExpress(!showCurrExpression)} />
                                <label className="form-check-label" htmlFor="expression">
                                    Show current expression
                                </label>
                            </div>
                        </div>
                    </div> */}
                </div>
            </header>
        </div>
    );
}

export default App;
