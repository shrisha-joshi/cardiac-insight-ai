"""
═══════════════════════════════════════════════════════════════════════════════
MODEL TRAINING SERVICE - Week 3 Implementation
═══════════════════════════════════════════════════════════════════════════════

Trains 3 models:
1. XGBoost (target: 95%+ accuracy)
2. Random Forest (target: 94%+ accuracy)  
3. Neural Network (target: 96%+ accuracy)

Ensemble (target: 96-97% accuracy)

═══════════════════════════════════════════════════════════════════════════════
"""

import numpy as np
import pandas as pd
from sklearn.metrics import (accuracy_score, precision_score, recall_score, 
                            f1_score, roc_auc_score, confusion_matrix,
                            classification_report)
from sklearn.ensemble import RandomForestClassifier
import xgboost as xgb
import tensorflow as tf
from tensorflow import keras
# from tensorflow.keras import layers # Removed to fix import resolution issue
import joblib
import json
import os
from datetime import datetime
from typing import Dict, Tuple, Any

class ModelTrainingService:
    """
    Trains and evaluates multiple ML models for cardiac risk prediction
    """
    
    def __init__(self):
        self.models = {}
        self.metrics = {}
        self.feature_names = []
        
    def train_xgboost(self, 
                     X_train: np.ndarray, 
                     y_train: np.ndarray,
                     X_val: np.ndarray,
                     y_val: np.ndarray,
                     **kwargs) -> xgb.XGBClassifier:
        """
        Train XGBoost classifier
        
        Target: 95%+ accuracy
        """
        print("\n" + "="*80)
        print("🚀 TRAINING XGBOOST MODEL")
        print("="*80)
        
        # Default hyperparameters
        params = {
            'n_estimators': kwargs.get('n_estimators', 200),
            'max_depth': kwargs.get('max_depth', 6),
            'learning_rate': kwargs.get('learning_rate', 0.1),
            'min_child_weight': kwargs.get('min_child_weight', 1),
            'subsample': kwargs.get('subsample', 0.8),
            'colsample_bytree': kwargs.get('colsample_bytree', 0.8),
            'objective': 'binary:logistic',
            'eval_metric': 'logloss',
            'random_state': 42,
            'n_jobs': -1
        }
        
        print(f"Hyperparameters:")
        for key, value in params.items():
            print(f"  {key}: {value}")
        
        # Train model
        print(f"\nTraining on {len(X_train):,} samples...")
        model = xgb.XGBClassifier(**params)
        
        model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=False
        )
        
        # Evaluate
        train_pred = model.predict(X_train)
        val_pred = model.predict(X_val)
        
        train_acc = accuracy_score(y_train, train_pred)
        val_acc = accuracy_score(y_val, val_pred)
        
        print(f"\n✅ XGBoost Training Complete!")
        print(f"   Training Accuracy:   {train_acc*100:.2f}%")
        print(f"   Validation Accuracy: {val_acc*100:.2f}%")
        
        if val_acc >= 0.95:
            print(f"   ✅ TARGET MET (95%+)")
        else:
            print(f"   ⚠️  Target: 95%+ (current: {val_acc*100:.2f}%)")
        
        self.models['xgboost'] = model
        self.metrics['xgboost'] = {
            'train_accuracy': float(train_acc),
            'val_accuracy': float(val_acc)
        }
        
        return model
    
    def train_random_forest(self,
                           X_train: np.ndarray,
                           y_train: np.ndarray,
                           X_val: np.ndarray,
                           y_val: np.ndarray,
                           **kwargs) -> RandomForestClassifier:
        """
        Train Random Forest classifier
        
        Target: 94%+ accuracy
        """
        print("\n" + "="*80)
        print("🌳 TRAINING RANDOM FOREST MODEL")
        print("="*80)
        
        # Default hyperparameters
        params = {
            'n_estimators': kwargs.get('n_estimators', 500),
            'max_depth': kwargs.get('max_depth', 15),
            'min_samples_split': kwargs.get('min_samples_split', 5),
            'min_samples_leaf': kwargs.get('min_samples_leaf', 2),
            'max_features': kwargs.get('max_features', 'sqrt'),
            'random_state': 42,
            'n_jobs': -1
        }
        
        print(f"Hyperparameters:")
        for key, value in params.items():
            print(f"  {key}: {value}")
        
        # Train model
        print(f"\nTraining on {len(X_train):,} samples...")
        model = RandomForestClassifier(**params)
        model.fit(X_train, y_train)
        
        # Evaluate
        train_pred = model.predict(X_train)
        val_pred = model.predict(X_val)
        
        train_acc = accuracy_score(y_train, train_pred)
        val_acc = accuracy_score(y_val, val_pred)
        
        print(f"\n✅ Random Forest Training Complete!")
        print(f"   Training Accuracy:   {train_acc*100:.2f}%")
        print(f"   Validation Accuracy: {val_acc*100:.2f}%")
        
        if val_acc >= 0.94:
            print(f"   ✅ TARGET MET (94%+)")
        else:
            print(f"   ⚠️  Target: 94%+ (current: {val_acc*100:.2f}%)")
        
        self.models['random_forest'] = model
        self.metrics['random_forest'] = {
            'train_accuracy': float(train_acc),
            'val_accuracy': float(val_acc)
        }
        
        return model
    
    def train_neural_network(self,
                            X_train: np.ndarray,
                            y_train: np.ndarray,
                            X_val: np.ndarray,
                            y_val: np.ndarray,
                            **kwargs) -> keras.Model:
        """
        Train Neural Network with TensorFlow/Keras
        
        Target: 96%+ accuracy
        """
        print("\n" + "="*80)
        print("🧠 TRAINING NEURAL NETWORK MODEL")
        print("="*80)
        
        input_dim = X_train.shape[1]
        
        # Build model architecture
        model = keras.Sequential([
            keras.layers.Input(shape=(input_dim,)),
            keras.layers.Dense(128, activation='relu', name='hidden1'),
            keras.layers.Dropout(0.3),
            keras.layers.Dense(64, activation='relu', name='hidden2'),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(32, activation='relu', name='hidden3'),
            keras.layers.Dropout(0.1),
            keras.layers.Dense(1, activation='sigmoid', name='output')
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        print("\nModel Architecture:")
        model.summary()
        
        # Train model
        print(f"\nTraining on {len(X_train):,} samples...")
        
        early_stopping = keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        )
        
        history = model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=kwargs.get('epochs', 50),
            batch_size=kwargs.get('batch_size', 32),
            callbacks=[early_stopping],
            verbose=1
        )
        
        # Evaluate
        train_loss, train_acc = model.evaluate(X_train, y_train, verbose=0)
        val_loss, val_acc = model.evaluate(X_val, y_val, verbose=0)
        
        print(f"\n✅ Neural Network Training Complete!")
        print(f"   Training Accuracy:   {train_acc*100:.2f}%")
        print(f"   Validation Accuracy: {val_acc*100:.2f}%")
        print(f"   Training Loss:       {train_loss:.4f}")
        print(f"   Validation Loss:     {val_loss:.4f}")
        
        if val_acc >= 0.96:
            print(f"   ✅ TARGET MET (96%+)")
        else:
            print(f"   ⚠️  Target: 96%+ (current: {val_acc*100:.2f}%)")
        
        self.models['neural_network'] = model
        self.metrics['neural_network'] = {
            'train_accuracy': float(train_acc),
            'val_accuracy': float(val_acc),
            'train_loss': float(train_loss),
            'val_loss': float(val_loss)
        }
        
        return model
    
    def create_ensemble(self,
                       X_val: np.ndarray,
                       y_val: np.ndarray,
                       weights: Dict[str, float] = None) -> Dict[str, float]:
        """
        Create ensemble predictions from trained models
        
        Target: 96-97% accuracy
        """
        print("\n" + "="*80)
        print("🎯 CREATING ENSEMBLE MODEL")
        print("="*80)
        
        if weights is None:
            weights = {
                'xgboost': 0.40,
                'random_forest': 0.35,
                'neural_network': 0.25
            }
        
        print("Ensemble weights:")
        for model_name, weight in weights.items():
            print(f"  {model_name}: {weight*100:.0f}%")
        
        # Get predictions from each model
        predictions = {}
        
        if 'xgboost' in self.models:
            predictions['xgboost'] = self.models['xgboost'].predict_proba(X_val)[:, 1]
        
        if 'random_forest' in self.models:
            predictions['random_forest'] = self.models['random_forest'].predict_proba(X_val)[:, 1]
        
        if 'neural_network' in self.models:
            predictions['neural_network'] = self.models['neural_network'].predict(X_val).flatten()
        
        # Weighted average
        ensemble_pred_proba = np.zeros(len(X_val))
        for model_name, pred in predictions.items():
            ensemble_pred_proba += pred * weights[model_name]
        
        ensemble_pred = (ensemble_pred_proba >= 0.5).astype(int)
        
        # Evaluate ensemble
        ensemble_acc = accuracy_score(y_val, ensemble_pred)
        
        print(f"\n✅ Ensemble Model Created!")
        print(f"   Validation Accuracy: {ensemble_acc*100:.2f}%")
        
        if ensemble_acc >= 0.96:
            print(f"   ✅ TARGET MET (96%+)")
        else:
            print(f"   ⚠️  Target: 96-97% (current: {ensemble_acc*100:.2f}%)")
        
        self.metrics['ensemble'] = {
            'val_accuracy': float(ensemble_acc),
            'weights': weights
        }
        
        return weights
    
    def evaluate_on_test(self,
                        X_test: np.ndarray,
                        y_test: np.ndarray,
                        ensemble_weights: Dict[str, float] = None) -> Dict[str, Any]:
        """
        Final evaluation on held-out test set
        """
        print("\n" + "="*80)
        print("📊 FINAL EVALUATION ON TEST SET")
        print("="*80)
        
        results = {}
        
        for model_name, model in self.models.items():
            print(f"\nEvaluating {model_name.upper()}...")
            
            if model_name == 'neural_network':
                y_pred_proba = model.predict(X_test).flatten()
            else:
                y_pred_proba = model.predict_proba(X_test)[:, 1]
            
            y_pred = (y_pred_proba >= 0.5).astype(int)
            
            # Calculate metrics
            acc = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred)
            recall = recall_score(y_test, y_pred)
            f1 = f1_score(y_test, y_pred)
            auc_roc = roc_auc_score(y_test, y_pred_proba)
            
            results[model_name] = {
                'accuracy': float(acc),
                'precision': float(precision),
                'recall': float(recall),
                'f1_score': float(f1),
                'auc_roc': float(auc_roc)
            }
            
            print(f"  Accuracy:  {acc*100:.2f}%")
            print(f"  Precision: {precision*100:.2f}%")
            print(f"  Recall:    {recall*100:.2f}%")
            print(f"  F1-Score:  {f1*100:.2f}%")
            print(f"  AUC-ROC:   {auc_roc*100:.2f}%")
        
        # Evaluate ensemble
        if ensemble_weights and len(self.models) == 3:
            print(f"\nEvaluating ENSEMBLE...")
            
            ensemble_pred_proba = np.zeros(len(X_test))
            for model_name, model in self.models.items():
                if model_name == 'neural_network':
                    pred = model.predict(X_test).flatten()
                else:
                    pred = model.predict_proba(X_test)[:, 1]
                ensemble_pred_proba += pred * ensemble_weights[model_name]
            
            ensemble_pred = (ensemble_pred_proba >= 0.5).astype(int)
            
            acc = accuracy_score(y_test, ensemble_pred)
            precision = precision_score(y_test, ensemble_pred)
            recall = recall_score(y_test, ensemble_pred)
            f1 = f1_score(y_test, ensemble_pred)
            auc_roc = roc_auc_score(y_test, ensemble_pred_proba)
            
            results['ensemble'] = {
                'accuracy': float(acc),
                'precision': float(precision),
                'recall': float(recall),
                'f1_score': float(f1),
                'auc_roc': float(auc_roc),
                'weights': ensemble_weights
            }
            
            print(f"  Accuracy:  {acc*100:.2f}%")
            print(f"  Precision: {precision*100:.2f}%")
            print(f"  Recall:    {recall*100:.2f}%")
            print(f"  F1-Score:  {f1*100:.2f}%")
            print(f"  AUC-ROC:   {auc_roc*100:.2f}%")
        
        return results
    
    def save_models(self, output_dir: str = 'models'):
        """Save all trained models"""
        os.makedirs(output_dir, exist_ok=True)
        
        print(f"\n💾 Saving models to {output_dir}/...")
        
        for model_name, model in self.models.items():
            if model_name == 'neural_network':
                model.save(f'{output_dir}/{model_name}_model.h5')
            else:
                joblib.dump(model, f'{output_dir}/{model_name}_model.pkl')
            print(f"  ✅ Saved {model_name}")
        
        # Save metrics
        with open(f'{output_dir}/training_metrics.json', 'w') as f:
            json.dump(self.metrics, f, indent=2)
        print(f"  ✅ Saved metrics")
        
        print("✅ All models saved successfully!")


# Test if run directly
if __name__ == "__main__":
    print("="*80)
    print("MODEL TRAINING SERVICE - Full Pipeline")
    print("="*80)
    
    # Load prepared data
    print("\n📂 Loading prepared data...")
    data = np.load('models/prepared_data.npz')
    X_train = data['X_train']
    X_val = data['X_val']
    X_test = data['X_test']
    y_train = data['y_train']
    y_val = data['y_val']
    y_test = data['y_test']
    
    print(f"✅ Data loaded:")
    print(f"   Train: {len(X_train):,} samples")
    print(f"   Val:   {len(X_val):,} samples")
    print(f"   Test:  {len(X_test):,} samples")
    
    # Initialize training service
    trainer = ModelTrainingService()
    
    # Train all models
    trainer.train_xgboost(X_train, y_train, X_val, y_val)
    trainer.train_random_forest(X_train, y_train, X_val, y_val)
    trainer.train_neural_network(X_train, y_train, X_val, y_val, epochs=50)
    
    # Create ensemble
    ensemble_weights = trainer.create_ensemble(X_val, y_val)
    
    # Final evaluation on test set
    test_results = trainer.evaluate_on_test(X_test, y_test, ensemble_weights)
    
    # Save models
    trainer.save_models()
    
    # Print final summary
    print("\n" + "="*80)
    print("✅ TRAINING COMPLETE - SUMMARY")
    print("="*80)
    print("\nTest Set Results:")
    for model_name, metrics in test_results.items():
        print(f"\n{model_name.upper()}:")
        print(f"  Accuracy:  {metrics['accuracy']*100:.2f}%")
        print(f"  Precision: {metrics['precision']*100:.2f}%")
        print(f"  Recall:    {metrics['recall']*100:.2f}%")
        print(f"  F1-Score:  {metrics['f1_score']*100:.2f}%")
        print(f"  AUC-ROC:   {metrics['auc_roc']*100:.2f}%")
    
    print("\n🎯 Models saved to: models/")
    print("   Ready for deployment!")
