'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

type PassportData = {
  isHuman: boolean;
  name?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: string;
  passportNumber?: string;
  issuingState?: string;
  expiryDate?: string;
  above18?: boolean;
  fromEU?: boolean;
  notOnOFACList?: boolean;
  timestamp: string;
  verificationProof: string;
};

type ProofSettings = {
  showName: boolean;
  showNationality: boolean;
  showDateOfBirth: boolean;
  showGender: boolean;
  showPassportNumber: boolean;
  showIssuingState: boolean;
  showExpiryDate: boolean;
  // Verification facts
  showIsHuman: boolean;
  showIsAdult: boolean;
  showNotOnSanctionsList: boolean;
};

interface ProofSettingsProps {
  passportData: PassportData | null;
  onSettingsChangeAction: (settings: ProofSettings) => void;
}

export default function ProofSettings({ passportData, onSettingsChangeAction }: ProofSettingsProps) {
  const { address } = useAccount();
  
  // Default settings - most privacy preserving
  const [settings, setSettings] = useState<ProofSettings>({
    showName: false,
    showNationality: true,
    showDateOfBirth: false,
    showGender: false,
    showPassportNumber: false,
    showIssuingState: true,
    showExpiryDate: false,
    // Verification facts - these are usually safe to share
    showIsHuman: true,
    showIsAdult: true,
    showNotOnSanctionsList: true,
  });

  // Load saved settings from localStorage on component mount
  useEffect(() => {
    if (address) {
      const savedSettings = localStorage.getItem(`proofSettings-${address}`);
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch (e) {
          console.error('Failed to parse saved settings', e);
        }
      }
    }
  }, [address]);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (address) {
      localStorage.setItem(`proofSettings-${address}`, JSON.stringify(settings));
      onSettingsChangeAction(settings);
    }
  }, [settings, address, onSettingsChangeAction]);

  // Handle checkbox changes
  const handleToggle = (key: keyof ProofSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!passportData) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-4">Privacy Settings</h2>
      <p className="text-gray-600 mb-4">
        Customize which information from your passport is included in your verification QR code.
      </p>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Passport Information</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showName"
                checked={settings.showName}
                onChange={() => handleToggle('showName')}
                className="mr-2"
              />
              <label htmlFor="showName">Name</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showNationality"
                checked={settings.showNationality}
                onChange={() => handleToggle('showNationality')}
                className="mr-2"
              />
              <label htmlFor="showNationality">Nationality</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showDateOfBirth"
                checked={settings.showDateOfBirth}
                onChange={() => handleToggle('showDateOfBirth')}
                className="mr-2"
              />
              <label htmlFor="showDateOfBirth">Date of Birth</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showGender"
                checked={settings.showGender}
                onChange={() => handleToggle('showGender')}
                className="mr-2"
              />
              <label htmlFor="showGender">Gender</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showPassportNumber"
                checked={settings.showPassportNumber}
                onChange={() => handleToggle('showPassportNumber')}
                className="mr-2"
              />
              <label htmlFor="showPassportNumber">Passport Number</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showIssuingState"
                checked={settings.showIssuingState}
                onChange={() => handleToggle('showIssuingState')}
                className="mr-2"
              />
              <label htmlFor="showIssuingState">Issuing Country</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showExpiryDate"
                checked={settings.showExpiryDate}
                onChange={() => handleToggle('showExpiryDate')}
                className="mr-2"
              />
              <label htmlFor="showExpiryDate">Expiry Date</label>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Verification Facts</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showIsHuman"
                checked={settings.showIsHuman}
                onChange={() => handleToggle('showIsHuman')}
                className="mr-2"
              />
              <label htmlFor="showIsHuman">Verified Human</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showIsAdult"
                checked={settings.showIsAdult}
                onChange={() => handleToggle('showIsAdult')}
                className="mr-2"
              />
              <label htmlFor="showIsAdult">Verified Adult (18+)</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showNotOnSanctionsList"
                checked={settings.showNotOnSanctionsList}
                onChange={() => handleToggle('showNotOnSanctionsList')}
                className="mr-2"
              />
              <label htmlFor="showNotOnSanctionsList">Not on Sanctions List</label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Privacy Tip:</strong> Only share the minimum information necessary. Your ZK proof allows you to prove facts about your identity without revealing the actual data.
        </p>
      </div>
    </div>
  );
} 