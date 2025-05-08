import React from 'react';

function FeedbackNN() {
    return(
        <div className="feedback-container">
            <h1>Feedback Neural Network</h1>
            <p>Esta es la pagina de Feedback Neural Network</p>
            <button className="btn" onClick={() => window.location.href = '/'}>Regresar</button>
        </div>
    )
}

export default FeedbackNN;