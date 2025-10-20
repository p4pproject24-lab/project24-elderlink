export interface UserResponse {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
    role: string;
    address: string;
    profileImageUrl?: string;
    firebaseUid: string;
    bloodType?: string;
    gender?: string;
    coreInformation?: string;
    // ElderlyStage2 fields
    dailyLife?: string;
    relationships?: string;
    medicalNeeds?: string;
    hobbies?: string;
    anythingElse?: string;
} 