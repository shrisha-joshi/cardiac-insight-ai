"""
═══════════════════════════════════════════════════════════════════════════════
DATA PREPARATION SERVICE - Week 3 Implementation
═══════════════════════════════════════════════════════════════════════════════

Loads 80,000+ records from enhanced dataset
Splits into train/validation/test
Performs feature engineering and normalization
Prepares data for ML model training

═══════════════════════════════════════════════════════════════════════════════
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from typing import Dict, Tuple, List
import json
import os

class DataPreparationService:
    """
    Prepares cardiac risk prediction data for ML training
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_names = []
        self.target_name = 'target'
        
    def load_data_from_json(self, json_path: str) -> pd.DataFrame:
        """
        Load data from JSON file (exported from TypeScript dataset loader)
        
        Args:
            json_path: Path to JSON file with dataset
            
        Returns:
            DataFrame with all records
        """
        print(f"📂 Loading data from {json_path}...")
        
        with open(json_path, 'r') as f:
            data = json.load(f)
        
        df = pd.DataFrame(data)
        print(f"✅ Loaded {len(df)} records")
        print(f"   Columns: {df.shape[1]}")
        print(f"   Features: {list(df.columns)[:10]}...")
        
        return df
    
    def generate_synthetic_data(self, n_samples: int = 80000) -> pd.DataFrame:
        """
        Generate synthetic cardiac risk data for training
        (Used if JSON export not available)
        
        Args:
            n_samples: Number of samples to generate
            
        Returns:
            DataFrame with synthetic data
        """
        print(f"🔧 Generating {n_samples} synthetic records...")
        
        np.random.seed(42)
        
        # Generate base features
        age = np.random.normal(54, 9, n_samples).clip(29, 77)
        sex = np.random.binomial(1, 0.68, n_samples)  # 68% male
        cp = np.random.choice([0, 1, 2, 3], n_samples, p=[0.47, 0.16, 0.29, 0.08])
        trestbps = np.random.normal(131, 17, n_samples).clip(94, 200)
        chol = np.random.normal(246, 51, n_samples).clip(126, 564)
        fbs = np.random.binomial(1, 0.15, n_samples)
        restecg = np.random.choice([0, 1, 2], n_samples, p=[0.50, 0.48, 0.02])
        thalach = np.random.normal(150, 22, n_samples).clip(71, 202)
        exang = np.random.binomial(1, 0.33, n_samples)
        oldpeak = np.random.exponential(1.0, n_samples).clip(0, 6.2)
        slope = np.random.choice([0, 1, 2], n_samples, p=[0.21, 0.49, 0.30])
        ca = np.random.choice([0, 1, 2, 3, 4], n_samples, p=[0.59, 0.21, 0.12, 0.06, 0.02])
        thal = np.random.choice([0, 1, 2, 3], n_samples, p=[0.02, 0.18, 0.55, 0.25])
        
        # Generate target based on risk factors
        risk_score = (
            (age - 29) / 48 * 0.15 +  # Age contribution
            sex * 0.10 +  # Sex contribution
            (cp == 0) * 0.20 +  # Asymptomatic chest pain high risk
            (trestbps > 140) * 0.15 +  # High BP
            (chol > 240) * 0.10 +  # High cholesterol
            fbs * 0.05 +  # High fasting blood sugar
            (thalach < 120) * 0.15 +  # Low max heart rate
            exang * 0.15 +  # Exercise induced angina
            (oldpeak > 2) * 0.15 +  # ST depression
            (ca > 0) * 0.10 +  # Fluoroscopy vessels
            (thal == 2) * 0.15  # Reversible defect
        )
        
        # Add noise and convert to binary target
        risk_score += np.random.normal(0, 0.1, n_samples)
        target = (risk_score > 0.5).astype(int)
        
        # Create DataFrame
        df = pd.DataFrame({
            'age': age,
            'sex': sex,
            'cp': cp,
            'trestbps': trestbps,
            'chol': chol,
            'fbs': fbs,
            'restecg': restecg,
            'thalach': thalach,
            'exang': exang,
            'oldpeak': oldpeak,
            'slope': slope,
            'ca': ca,
            'thal': thal,
            'target': target
        })
        
        print(f"✅ Generated {len(df)} records")
        print(f"   Target distribution: {target.mean():.1%} high risk")
        
        return df
    
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create additional features from raw data
        
        Args:
            df: Raw DataFrame
            
        Returns:
            DataFrame with engineered features
        """
        print("🔧 Engineering features...")
        
        df_features = df.copy()
        
        # Age groups
        df_features['age_group'] = pd.cut(df['age'], 
                                          bins=[0, 40, 50, 60, 100],
                                          labels=[0, 1, 2, 3])
        
        # Cholesterol risk
        df_features['chol_risk'] = (df['chol'] > 240).astype(int)
        
        # Blood pressure risk
        df_features['bp_risk'] = (df['trestbps'] > 140).astype(int)
        
        # Heart rate reserve (if max HR available)
        if 'thalach' in df.columns:
            predicted_max_hr = 220 - df['age']
            df_features['hr_reserve'] = (df['thalach'] / predicted_max_hr).clip(0, 1)
        
        # Cholesterol/HDL ratio (if HDL available)
        if 'hdl' in df.columns:
            df_features['chol_hdl_ratio'] = (df['chol'] / df['hdl']).clip(0, 10)
        
        # Risk score composite
        if all(col in df.columns for col in ['age', 'trestbps', 'chol']):
            df_features['composite_risk'] = (
                (df['age'] / 100) * 0.3 +
                (df['trestbps'] / 200) * 0.3 +
                (df['chol'] / 300) * 0.4
            )
        
        # Interaction features
        if 'sex' in df.columns and 'age' in df.columns:
            df_features['sex_age_interaction'] = df['sex'] * df['age']
        
        print(f"✅ Engineered {df_features.shape[1] - df.shape[1]} new features")
        
        return df_features
    
    def prepare_data(self, 
                    df: pd.DataFrame,
                    test_size: float = 0.15,
                    val_size: float = 0.15,
                    random_state: int = 42) -> Tuple[np.ndarray, np.ndarray, np.ndarray, 
                                                      np.ndarray, np.ndarray, np.ndarray]:
        """
        Prepare data for training: split, scale, encode
        
        Args:
            df: Input DataFrame
            test_size: Proportion for test set
            val_size: Proportion for validation set
            random_state: Random seed
            
        Returns:
            Tuple of (X_train, X_val, X_test, y_train, y_val, y_test)
        """
        print("🔧 Preparing data for training...")
        
        # Engineer features
        df = self.engineer_features(df)
        
        # Separate features and target
        if 'target' in df.columns:
            y = df['target'].values
            X = df.drop('target', axis=1)
        elif 'diagnosis' in df.columns:
            y = df['diagnosis'].values
            X = df.drop('diagnosis', axis=1)
        else:
            raise ValueError("No target column found (expected 'target' or 'diagnosis')")
        
        # Handle categorical features
        categorical_cols = X.select_dtypes(include=['object', 'category']).columns
        for col in categorical_cols:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
                X[col] = self.label_encoders[col].fit_transform(X[col].astype(str))
            else:
                X[col] = self.label_encoders[col].transform(X[col].astype(str))
        
        # Store feature names
        self.feature_names = list(X.columns)
        
        # Convert to numpy
        X = X.values
        
        # Split: first train+val, then split val from train
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        val_size_adjusted = val_size / (1 - test_size)
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=val_size_adjusted, random_state=random_state, stratify=y_temp
        )
        
        # Scale features
        X_train = self.scaler.fit_transform(X_train)
        X_val = self.scaler.transform(X_val)
        X_test = self.scaler.transform(X_test)
        
        print(f"✅ Data prepared:")
        print(f"   Training:   {X_train.shape[0]:,} samples ({X_train.shape[0]/len(df)*100:.1f}%)")
        print(f"   Validation: {X_val.shape[0]:,} samples ({X_val.shape[0]/len(df)*100:.1f}%)")
        print(f"   Test:       {X_test.shape[0]:,} samples ({X_test.shape[0]/len(df)*100:.1f}%)")
        print(f"   Features:   {X_train.shape[1]}")
        print(f"   Target distribution:")
        print(f"     Train: {y_train.mean():.1%} high risk")
        print(f"     Val:   {y_val.mean():.1%} high risk")
        print(f"     Test:  {y_test.mean():.1%} high risk")
        
        return X_train, X_val, X_test, y_train, y_val, y_test
    
    def save_preprocessor(self, filepath: str):
        """Save scaler and encoders"""
        import joblib
        joblib.dump({
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'feature_names': self.feature_names
        }, filepath)
        print(f"✅ Saved preprocessor to {filepath}")
    
    def load_preprocessor(self, filepath: str):
        """Load scaler and encoders"""
        import joblib
        data = joblib.load(filepath)
        self.scaler = data['scaler']
        self.label_encoders = data['label_encoders']
        self.feature_names = data['feature_names']
        print(f"✅ Loaded preprocessor from {filepath}")


# Test if run directly
if __name__ == "__main__":
    print("="*80)
    print("DATA PREPARATION SERVICE - Test")
    print("="*80)
    
    # Initialize service
    prep_service = DataPreparationService()
    
    # Generate synthetic data
    df = prep_service.generate_synthetic_data(n_samples=80000)
    
    # Prepare data
    X_train, X_val, X_test, y_train, y_val, y_test = prep_service.prepare_data(df)
    
    # Save preprocessor
    os.makedirs('models', exist_ok=True)
    prep_service.save_preprocessor('models/preprocessor.pkl')
    
    # Save prepared data
    np.savez('models/prepared_data.npz',
             X_train=X_train, X_val=X_val, X_test=X_test,
             y_train=y_train, y_val=y_val, y_test=y_test)
    
    print("\n✅ Data preparation complete!")
    print(f"   Saved to: models/prepared_data.npz")
    print(f"   Ready for training!")
