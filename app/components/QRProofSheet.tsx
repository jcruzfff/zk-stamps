'use client';

import { useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
  showIsHuman: boolean;
  showIsAdult: boolean;
  showNotOnSanctionsList: boolean;
  initialized?: boolean;
};

type QRProofSheetProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  passportData: PassportData | null;
  proofSettings: ProofSettings;
};

// Define a type for filtered passport data
type FilteredPassportData = {
  name?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: string;
  passportNumber?: string;
  issuingState?: string;
  expiryDate?: string;
  isHuman?: boolean;
  isAdult?: boolean;
  notOnSanctionsList?: boolean;
  walletAddress: string;
  verificationProof: string;
  timestamp: string;
};

export default function QRProofSheet({ 
  isOpen, 
  onCloseAction, 
  passportData, 
  proofSettings 
}: QRProofSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const { address } = useAccount();

  // Generate QR code data based on passport data and proof settings
  const getFilteredPassportData = (): FilteredPassportData | null => {
    if (!passportData || !address) return null;
    
    const filteredData: Partial<FilteredPassportData> = {};
    
    // Only include fields that are enabled in privacy settings
    if (proofSettings.showName && passportData.name) filteredData.name = passportData.name;
    if (proofSettings.showNationality && passportData.nationality) filteredData.nationality = passportData.nationality;
    if (proofSettings.showDateOfBirth && passportData.dateOfBirth) filteredData.dateOfBirth = passportData.dateOfBirth;
    if (proofSettings.showGender && passportData.gender) filteredData.gender = passportData.gender;
    if (proofSettings.showPassportNumber && passportData.passportNumber) filteredData.passportNumber = passportData.passportNumber;
    if (proofSettings.showIssuingState && passportData.issuingState) filteredData.issuingState = passportData.issuingState;
    if (proofSettings.showExpiryDate && passportData.expiryDate) filteredData.expiryDate = passportData.expiryDate;
    
    // Include verification facts
    if (proofSettings.showIsHuman && passportData.isHuman) filteredData.isHuman = passportData.isHuman;
    if (proofSettings.showIsAdult && passportData.above18) filteredData.isAdult = passportData.above18;
    if (proofSettings.showNotOnSanctionsList && passportData.notOnOFACList) filteredData.notOnSanctionsList = passportData.notOnOFACList;
    
    // Add wallet address and verification proof
    filteredData.walletAddress = address;
    filteredData.verificationProof = passportData.verificationProof;
    filteredData.timestamp = new Date().toISOString();
    
    return filteredData as FilteredPassportData;
  };

  const qrData = JSON.stringify({
    type: 'PASSPORT_PROOF',
    data: getFilteredPassportData() || {},
  });

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) {
        onCloseAction();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onCloseAction]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center backdrop-blur-sm">
      <div 
        ref={sheetRef}
        className="bg-white rounded-xl w-full max-w-md mx-4 p-8 relative shadow-2xl"
      >
        {/* Close button (X) in top right */}
        <button 
          onClick={onCloseAction}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Decorative elements */}
        <div className="absolute -top-3 -left-3 w-24 h-24 text-[#45A7E8] opacity-20">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <circle cx="20" cy="20" r="10" />
            <circle cx="60" cy="20" r="15" />
            <circle cx="20" cy="60" r="15" />
            <circle cx="60" cy="60" r="10" />
          </svg>
        </div>
        <div className="absolute -bottom-3 -right-3 w-24 h-24 text-[#45A7E8] opacity-20 rotate-45">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <circle cx="20" cy="20" r="10" />
            <circle cx="60" cy="20" r="15" />
            <circle cx="20" cy="60" r="15" />
            <circle cx="60" cy="60" r="10" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold mb-4 text-center text-[#45A7E8]">Passport Proof</h2>
        <p className="text-gray-600 mb-6 text-center">
          Share this QR code to prove your passport identity.
        </p>
        
        <div className="flex justify-center py-4">
          <div className="bg-white p-4 rounded-xl border-2 border-[#45A7E8]/20 shadow-md">
            <QRCodeSVG 
              value={qrData} 
              size={250}
              bgColor={"#FFFFFF"}
              fgColor={"#000000"}
              level={"M"}
              includeMargin={false}
            />
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-[#45A7E8]/10 rounded-xl border border-[#45A7E8]/20">
          <h3 className="font-medium text-[#45A7E8] mb-2">Information included:</h3>
          <div className="grid grid-cols-2 gap-2">
            {proofSettings.showIsHuman && 
              <div className="flex items-center">
                <span className="text-[#45A7E8] mr-2">✓</span>
                <span className="text-sm text-gray-700">Human verification</span>
              </div>
            }
            {proofSettings.showIsAdult && 
              <div className="flex items-center">
                <span className="text-[#45A7E8] mr-2">✓</span>
                <span className="text-sm text-gray-700">Age verification (18+)</span>
              </div>
            }
            {proofSettings.showNotOnSanctionsList && 
              <div className="flex items-center">
                <span className="text-[#45A7E8] mr-2">✓</span>
                <span className="text-sm text-gray-700">Sanctions list check</span>
              </div>
            }
            {proofSettings.showNationality && 
              <div className="flex items-center">
                <span className="text-[#45A7E8] mr-2">✓</span>
                <span className="text-sm text-gray-700">Nationality</span>
              </div>
            }
            {proofSettings.showIssuingState && 
              <div className="flex items-center">
                <span className="text-[#45A7E8] mr-2">✓</span>
                <span className="text-sm text-gray-700">Issuing country</span>
              </div>
            }
            {proofSettings.showName && 
              <div className="flex items-center">
                <span className="text-[#45A7E8] mr-2">✓</span>
                <span className="text-sm text-gray-700">Name</span>
              </div>
            }
            {proofSettings.showDateOfBirth && 
              <div className="flex items-center">
                <span className="text-[#45A7E8] mr-2">✓</span>
                <span className="text-sm text-gray-700">Date of birth</span>
              </div>
            }
            {proofSettings.showGender && 
              <div className="flex items-center">
                <span className="text-[#45A7E8] mr-2">✓</span>
                <span className="text-sm text-gray-700">Gender</span>
              </div>
            }
            {proofSettings.showPassportNumber && 
              <div className="flex items-center">
                <span className="text-[#45A7E8] mr-2">✓</span>
                <span className="text-sm text-gray-700">Passport number</span>
              </div>
            }
            {proofSettings.showExpiryDate && 
              <div className="flex items-center">
                <span className="text-[#45A7E8] mr-2">✓</span>
                <span className="text-sm text-gray-700">Expiry date</span>
              </div>
            }
          </div>
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => {
              // Add share functionality if needed
              alert('Sharing functionality would be implemented here');
            }}
            className="w-full py-3 bg-[#45A7E8] text-white rounded-full hover:bg-[#3A8AC2] transition-colors font-medium shadow-md hover:shadow-lg flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>
      </div>
    </div>
  );
} 