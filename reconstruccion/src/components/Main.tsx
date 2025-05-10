
function Main() {
    

    return (
        <div className="main-container">
            <h1>Inteligencia Artificial</h1>
            <p>Escoja Opcion a Usar</p>
            <div>
                <button className="btn" onClick={() => window.location.href = '/algoritmos-geneticos'}>Algoritmos Geneticos</button>
                <button className="btn" onClick={() => window.location.href = '/feedback-neural-network'}>Feedback Neural Network</button>
            </div>
        </div>
    )
}

export default Main;