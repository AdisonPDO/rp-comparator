import React, { useState } from 'react';
import RacketComparison from "./racket_comparator";
import SimilarRacketsComparison from "./SimilarRacketComparison";
const RacketComparisonTabs = () => {
    const [activeTab, setActiveTab] = useState('compare');

    return (
        <div className="racket-comparison-tabs">
            <div className="tabs-container">
                <button
                    className={`tab ${activeTab === 'compare' ? 'active' : ''}`}
                    onClick={() => setActiveTab('compare')}
                >
                    Comparateur de Raquettes
                </button>
                <button
                    className={`tab ${activeTab === 'similar' ? 'active' : ''}`}
                    onClick={() => setActiveTab('similar')}
                >
                    Raquettes Similaires
                </button>
            </div>
            <div className="tab-content">
                {activeTab === 'compare' ? <RacketComparison /> : <SimilarRacketsComparison />}
            </div>
        </div>
    );
};

export default RacketComparisonTabs;