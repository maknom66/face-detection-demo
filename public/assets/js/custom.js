async function detectFace(mode, showCurrExpression, showAgeGender) {
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