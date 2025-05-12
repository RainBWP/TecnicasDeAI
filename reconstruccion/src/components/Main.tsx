import { useNavigate } from 'react-router-dom';

function Main() {
    const navigate = useNavigate();
    

    return (
        <div className="main-container">
            <h1>Inteligencia Artificial</h1>
            <p>Escoja Opcion a Usar</p>
            <div>
                <button className="btn" onClick={() => navigate('/algoritmos-geneticos')}>Algoritmos Geneticos</button>
                <button className="btn" onClick={() => navigate('/feedback-neural-network')}>Feedback Neural Network</button>
            </div>
        </div>
    )
}

export default Main;