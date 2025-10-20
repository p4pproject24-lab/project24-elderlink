package com.example.ai_companion.service;

import com.example.ai_companion.dto.UserDTO;
import com.example.ai_companion.exception.UserProfileValidationException;
import com.example.ai_companion.model.User;
import com.example.ai_companion.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.atLeast;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ConnectionService connectionService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private UserDTO testUserDTO;
    private String testUserId;

    @BeforeEach
    void setUp() {
        testUserId = "user123";

        testUser = new User();
        testUser.setId(testUserId);
        testUser.setFirebaseUid("firebase123");
        testUser.setEmail("test@example.com");
        testUser.setFullName("Test User");
        testUser.setRole(User.Role.ELDERLY);
        testUser.setCurrentProfileStep(1);
        testUser.setHighestStepReached(1);
        testUser.setProfileStep1Completed(false);
        testUser.setProfileStep2Completed(false);
        testUser.setProfileStep3Completed(false);
        testUser.setProfileFlowCompleted(false);
        testUser.setCaregiverIds(new ArrayList<>());
        testUser.setElderlyUserIds(new ArrayList<>());
        testUser.setFavoriteCaregiverIds(new ArrayList<>());
        testUser.setFavoriteElderlyIds(new ArrayList<>());

        testUserDTO = new UserDTO();
        testUserDTO.setFullName("Test User");
        testUserDTO.setAddress("123 Test St");
        testUserDTO.setDateOfBirth("1990-01-01");
        testUserDTO.setPhoneNumber("123-456-7890");
        testUserDTO.setProfileImageUrl("http://example.com/image.jpg");
        testUserDTO.setBloodType("O+");
        testUserDTO.setGender("Male");
        testUserDTO.setDailyLife("Test daily life");
        testUserDTO.setRelationships("Test relationships");
        testUserDTO.setMedicalNeeds("Test medical needs");
        testUserDTO.setHobbies("Test hobbies");
        testUserDTO.setAnythingElse("Test anything else");
    }

    @Test
    void updateUserProfile_WithValidInput_ShouldUpdateProfile() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        userService.updateUserProfile(authentication, testUserDTO);

        // Assert
        verify(authentication, atLeast(1)).getPrincipal();
        verify(userRepository).save(testUser);
        assertTrue(testUser.getProfileStep1Completed());
        assertEquals(2, testUser.getCurrentProfileStep());
        assertEquals("Test User", testUser.getFullName());
        assertEquals("123 Test St", testUser.getAddress());
        assertEquals("1990-01-01", testUser.getDateOfBirth());
        assertEquals("123-456-7890", testUser.getPhoneNumber());
        assertEquals("http://example.com/image.jpg", testUser.getProfileImageUrl());
        assertEquals("O+", testUser.getBloodType());
        assertEquals("Male", testUser.getGender());
    }

    @Test
    void updateUserProfile_WithNullAuthentication_ShouldThrowException() {
        // Act & Assert
        UserProfileValidationException exception = assertThrows(UserProfileValidationException.class, () -> {
            userService.updateUserProfile(null, testUserDTO);
        });
        assertEquals("User not authenticated", exception.getMessage());
    }

    @Test
    void updateUserProfile_WithInvalidDate_ShouldThrowException() {
        // Arrange
        testUserDTO.setDateOfBirth("invalid-date");
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act & Assert
        UserProfileValidationException exception = assertThrows(UserProfileValidationException.class, () -> {
            userService.updateUserProfile(authentication, testUserDTO);
        });
        assertEquals("Date of birth must be in YYYY-MM-DD format", exception.getMessage());
    }

    @Test
    void updateUserProfile_WithInvalidPhone_ShouldThrowException() {
        // Arrange
        testUserDTO.setPhoneNumber("invalid-phone");
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act & Assert
        UserProfileValidationException exception = assertThrows(UserProfileValidationException.class, () -> {
            userService.updateUserProfile(authentication, testUserDTO);
        });
        assertEquals("Invalid phone number format", exception.getMessage());
    }

    @Test
    void updateUserProfile_WithEmptyFullName_ShouldThrowException() {
        // Arrange
        testUserDTO.setFullName("");
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act & Assert
        UserProfileValidationException exception = assertThrows(UserProfileValidationException.class, () -> {
            userService.updateUserProfile(authentication, testUserDTO);
        });
        assertEquals("Full name is required", exception.getMessage());
    }

    @Test
    void updateUserProfile_WithEmptyAddress_ShouldThrowException() {
        // Arrange
        testUserDTO.setAddress("");
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act & Assert
        UserProfileValidationException exception = assertThrows(UserProfileValidationException.class, () -> {
            userService.updateUserProfile(authentication, testUserDTO);
        });
        assertEquals("Address is required", exception.getMessage());
    }

    @Test
    void updateUserProfile_WithElderlyUser_ShouldSetCoreInformation() {
        // Arrange
        testUser.setRole(User.Role.ELDERLY);
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        userService.updateUserProfile(authentication, testUserDTO);

        // Assert
        verify(userRepository).save(testUser);
        assertNotNull(testUser.getCoreInformation());
        assertTrue(testUser.getCoreInformation().contains("Daily Life: Test daily life"));
        assertTrue(testUser.getCoreInformation().contains("Relationships: Test relationships"));
        assertTrue(testUser.getCoreInformation().contains("Medical Needs: Test medical needs"));
        assertTrue(testUser.getCoreInformation().contains("Hobbies: Test hobbies"));
        assertTrue(testUser.getCoreInformation().contains("Additional Info: Test anything else"));
    }

    @Test
    void hasCompletedProfileSetup_WithCompletedProfile_ShouldReturnTrue() {
        // Arrange
        testUser.setCoreInformation("Test core information");
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        // Act
        boolean result = userService.hasCompletedProfileSetup(testUserId);

        // Assert
        assertTrue(result);
        verify(userRepository).findById(testUserId);
    }

    @Test
    void hasCompletedProfileSetup_WithIncompleteProfile_ShouldReturnFalse() {
        // Arrange
        testUser.setCoreInformation(null);
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        // Act
        boolean result = userService.hasCompletedProfileSetup(testUserId);

        // Assert
        assertFalse(result);
        verify(userRepository).findById(testUserId);
    }

    @Test
    void hasCompletedProfileSetup_WithNullUser_ShouldReturnFalse() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // Act
        boolean result = userService.hasCompletedProfileSetup(testUserId);

        // Assert
        assertFalse(result);
        verify(userRepository).findById(testUserId);
    }

    @Test
    void updateProfileStep_WithValidInput_ShouldUpdateStep() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        userService.updateProfileStep(authentication, 2);

        // Assert
        verify(authentication, atLeast(1)).getPrincipal();
        verify(userRepository).save(testUser);
        assertEquals(2, testUser.getCurrentProfileStep());
        assertEquals(2, testUser.getHighestStepReached());
        assertTrue(testUser.getProfileStep2Completed());
    }

    @Test
    void updateProfileStep_WithNullAuthentication_ShouldThrowException() {
        // Act & Assert
        UserProfileValidationException exception = assertThrows(UserProfileValidationException.class, () -> {
            userService.updateProfileStep(null, 2);
        });
        assertEquals("User not authenticated", exception.getMessage());
    }

    @Test
    void updateProfileStep_WithElderlyUser_ShouldCompleteFlowAtStep3() {
        // Arrange
        testUser.setRole(User.Role.ELDERLY);
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        userService.updateProfileStep(authentication, 3);

        // Assert
        verify(userRepository).save(testUser);
        assertTrue(testUser.getProfileFlowCompleted());
        assertTrue(testUser.getProfileStep3Completed());
    }

    @Test
    void updateProfileStep_WithCaregiverUser_ShouldCompleteFlowAtStep2() {
        // Arrange
        testUser.setRole(User.Role.CAREGIVER);
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        userService.updateProfileStep(authentication, 2);

        // Assert
        verify(userRepository).save(testUser);
        assertTrue(testUser.getProfileFlowCompleted());
        assertTrue(testUser.getProfileStep2Completed());
    }

    @Test
    void goBackToStep_WithValidInput_ShouldUpdateStep() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        userService.goBackToStep(authentication, 1);

        // Assert
        verify(authentication, atLeast(1)).getPrincipal();
        verify(userRepository).save(testUser);
        assertEquals(1, testUser.getCurrentProfileStep());
    }

    @Test
    void goBackToStep_WithNullAuthentication_ShouldThrowException() {
        // Act & Assert
        UserProfileValidationException exception = assertThrows(UserProfileValidationException.class, () -> {
            userService.goBackToStep(null, 1);
        });
        assertEquals("User not authenticated", exception.getMessage());
    }

    @Test
    void completeProfileFlow_WithValidInput_ShouldCompleteFlow() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        userService.completeProfileFlow(authentication);

        // Assert
        verify(authentication, atLeast(1)).getPrincipal();
        verify(userRepository).save(testUser);
        assertTrue(testUser.getProfileFlowCompleted());
    }

    @Test
    void completeProfileFlow_WithNullAuthentication_ShouldThrowException() {
        // Act & Assert
        UserProfileValidationException exception = assertThrows(UserProfileValidationException.class, () -> {
            userService.completeProfileFlow(null);
        });
        assertEquals("User not authenticated", exception.getMessage());
    }

    @Test
    void getProfileFlowStatus_WithValidInput_ShouldReturnStatus() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(connectionService.getConnectedCaregiversForElderly(anyString())).thenReturn(new ArrayList<>());

        // Act
        User.ProfileFlowStatus result = userService.getProfileFlowStatus(authentication);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getCurrentStep());
        assertEquals(1, result.getHighestStepReached());
        assertFalse(result.getStep1Completed());
        assertFalse(result.getStep2Completed());
        assertFalse(result.getStep3Completed());
        assertFalse(result.getFlowCompleted());
        assertFalse(result.getHasConnections());
        verify(authentication, atLeast(1)).getPrincipal();
    }

    @Test
    void getProfileFlowStatus_WithNullAuthentication_ShouldThrowException() {
        // Act & Assert
        UserProfileValidationException exception = assertThrows(UserProfileValidationException.class, () -> {
            userService.getProfileFlowStatus(null);
        });
        assertEquals("User not authenticated", exception.getMessage());
    }

    @Test
    void shouldShowProfileFlow_WithNullAuthentication_ShouldReturnFalse() {
        // Act
        boolean result = userService.shouldShowProfileFlow(null);

        // Assert
        assertFalse(result);
    }

    @Test
    void shouldShowProfileFlow_WithIncompleteProfile_ShouldReturnTrue() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        boolean result = userService.shouldShowProfileFlow(authentication);

        // Assert
        assertTrue(result);
        verify(authentication, atLeast(1)).getPrincipal();
    }

    @Test
    void shouldShowProfileFlow_WithCompletedProfileAndConnections_ShouldReturnFalse() {
        // Arrange
        testUser.setProfileFlowCompleted(true);
        testUser.setCaregiverIds(Arrays.asList("caregiver1"));
        when(authentication.getPrincipal()).thenReturn(testUser);
        User mockCaregiver = new User();
        mockCaregiver.setId("caregiver1");
        when(connectionService.getConnectedCaregiversForElderly(anyString())).thenReturn(Arrays.asList(mockCaregiver));

        // Act
        boolean result = userService.shouldShowProfileFlow(authentication);

        // Assert
        assertFalse(result);
        verify(authentication, atLeast(1)).getPrincipal();
    }

    @Test
    void getFavorites_WithValidUser_ShouldReturnFavorites() {
        // Arrange
        testUser.setFavoriteCaregiverIds(Arrays.asList("caregiver1", "caregiver2"));
        testUser.setFavoriteElderlyIds(Arrays.asList("elderly1"));
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(testUser);

        // Act
        Map<String, List<String>> result = userService.getFavorites(testUserId);

        // Assert
        assertNotNull(result);
        assertEquals(Arrays.asList("caregiver1", "caregiver2"), result.get("favoriteCaregiverIds"));
        assertEquals(Arrays.asList("elderly1"), result.get("favoriteElderlyIds"));
        verify(userRepository, atLeast(1)).findByFirebaseUid(testUserId);
    }

    @Test
    void getFavorites_WithNullUser_ShouldReturnEmptyMap() {
        // Arrange
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(null);

        // Act
        Map<String, List<String>> result = userService.getFavorites(testUserId);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(userRepository, atLeast(1)).findByFirebaseUid(testUserId);
    }

    @Test
    void toggleFavorite_WithCaregiverType_ShouldToggleFavorite() {
        // Arrange
        testUser.setFavoriteCaregiverIds(new ArrayList<>());
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        Map<String, List<String>> result = userService.toggleFavorite(testUserId, "caregiver1", "caregiver");

        // Assert
        assertNotNull(result);
        assertTrue(testUser.getFavoriteCaregiverIds().contains("caregiver1"));
        verify(userRepository, atLeast(1)).findByFirebaseUid(testUserId);
        verify(userRepository).save(testUser);
    }

    @Test
    void toggleFavorite_WithElderlyType_ShouldToggleFavorite() {
        // Arrange
        testUser.setFavoriteElderlyIds(new ArrayList<>());
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        Map<String, List<String>> result = userService.toggleFavorite(testUserId, "elderly1", "elderly");

        // Assert
        assertNotNull(result);
        assertTrue(testUser.getFavoriteElderlyIds().contains("elderly1"));
        verify(userRepository, atLeast(1)).findByFirebaseUid(testUserId);
        verify(userRepository).save(testUser);
    }

    @Test
    void toggleFavorite_WithNullUser_ShouldReturnEmptyMap() {
        // Arrange
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(null);

        // Act
        Map<String, List<String>> result = userService.toggleFavorite(testUserId, "caregiver1", "caregiver");

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(userRepository, atLeast(1)).findByFirebaseUid(testUserId);
    }

    @Test
    void toggleFavorite_WithMaxFavorites_ShouldNotAddMore() {
        // Arrange
        testUser.setFavoriteCaregiverIds(Arrays.asList("caregiver1", "caregiver2"));
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        Map<String, List<String>> result = userService.toggleFavorite(testUserId, "caregiver3", "caregiver");

        // Assert
        assertNotNull(result);
        assertEquals(2, testUser.getFavoriteCaregiverIds().size());
        assertFalse(testUser.getFavoriteCaregiverIds().contains("caregiver3"));
        verify(userRepository, atLeast(1)).findByFirebaseUid(testUserId);
        verify(userRepository).save(testUser);
    }

    @Test
    void toggleFavorite_WithExistingFavorite_ShouldRemoveFavorite() {
        // Arrange
        testUser.setFavoriteCaregiverIds(new ArrayList<>(Arrays.asList("caregiver1")));
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        Map<String, List<String>> result = userService.toggleFavorite(testUserId, "caregiver1", "caregiver");

        // Assert
        assertNotNull(result);
        assertFalse(testUser.getFavoriteCaregiverIds().contains("caregiver1"));
        verify(userRepository, atLeast(1)).findByFirebaseUid(testUserId);
        verify(userRepository).save(testUser);
    }

    // Additional tests to improve branch coverage for shouldShowProfileFlow
    @Test
    void shouldShowProfileFlow_WithNonUserPrincipal_ShouldReturnFalse() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn("not a user");

        // Act
        boolean result = userService.shouldShowProfileFlow(authentication);

        // Assert
        assertFalse(result);
    }

    @Test
    void shouldShowProfileFlow_WithElderlyUserMissingStep3_ShouldReturnTrue() {
        // Arrange
        testUser.setRole(User.Role.ELDERLY);
        testUser.setProfileStep1Completed(true);
        testUser.setProfileStep2Completed(true);
        testUser.setProfileStep3Completed(false);
        testUser.setProfileFlowCompleted(false);
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        boolean result = userService.shouldShowProfileFlow(authentication);

        // Assert
        assertTrue(result);
    }

    @Test
    void shouldShowProfileFlow_WithElderlyUserCompletedStepsButNoConnections_ShouldReturnTrue() {
        // Arrange
        testUser.setRole(User.Role.ELDERLY);
        testUser.setProfileStep1Completed(true);
        testUser.setProfileStep2Completed(true);
        testUser.setProfileStep3Completed(true);
        testUser.setProfileFlowCompleted(true);
        testUser.setCaregiverIds(new ArrayList<>());
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(connectionService.getConnectedCaregiversForElderly(anyString())).thenReturn(new ArrayList<>());

        // Act
        boolean result = userService.shouldShowProfileFlow(authentication);

        // Assert
        assertTrue(result);
    }

    @Test
    void shouldShowProfileFlow_WithCaregiverUserMissingStep2_ShouldReturnTrue() {
        // Arrange
        testUser.setRole(User.Role.CAREGIVER);
        testUser.setProfileStep1Completed(true);
        testUser.setProfileStep2Completed(false);
        testUser.setProfileStep3Completed(false);
        testUser.setProfileFlowCompleted(false);
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        boolean result = userService.shouldShowProfileFlow(authentication);

        // Assert
        assertTrue(result);
    }

    @Test
    void shouldShowProfileFlow_WithCaregiverUserCompletedStepsButNoConnections_ShouldReturnTrue() {
        // Arrange
        testUser.setRole(User.Role.CAREGIVER);
        testUser.setProfileStep1Completed(true);
        testUser.setProfileStep2Completed(true);
        testUser.setProfileStep3Completed(false);
        testUser.setProfileFlowCompleted(true);
        testUser.setElderlyUserIds(new ArrayList<>());
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(connectionService.getConnectedElderlyForCaregiver(anyString())).thenReturn(new ArrayList<>());

        // Act
        boolean result = userService.shouldShowProfileFlow(authentication);

        // Assert
        assertTrue(result);
    }

    @Test
    void shouldShowProfileFlow_WithElderlyUserWithConnections_ShouldReturnFalse() {
        // Arrange
        testUser.setRole(User.Role.ELDERLY);
        testUser.setProfileStep1Completed(true);
        testUser.setProfileStep2Completed(true);
        testUser.setProfileStep3Completed(true);
        testUser.setProfileFlowCompleted(true);
        testUser.setCaregiverIds(Arrays.asList("caregiver1"));
        when(authentication.getPrincipal()).thenReturn(testUser);
        User mockCaregiver = new User();
        mockCaregiver.setId("caregiver1");
        when(connectionService.getConnectedCaregiversForElderly(anyString())).thenReturn(Arrays.asList(mockCaregiver));

        // Act
        boolean result = userService.shouldShowProfileFlow(authentication);

        // Assert
        assertFalse(result);
    }

    @Test
    void shouldShowProfileFlow_WithCaregiverUserWithConnections_ShouldReturnFalse() {
        // Arrange
        testUser.setRole(User.Role.CAREGIVER);
        testUser.setProfileStep1Completed(true);
        testUser.setProfileStep2Completed(true);
        testUser.setProfileStep3Completed(false);
        testUser.setProfileFlowCompleted(true);
        testUser.setElderlyUserIds(Arrays.asList("elderly1"));
        when(authentication.getPrincipal()).thenReturn(testUser);
        User mockElderly = new User();
        mockElderly.setId("elderly1");
        when(connectionService.getConnectedElderlyForCaregiver(anyString())).thenReturn(Arrays.asList(mockElderly));

        // Act
        boolean result = userService.shouldShowProfileFlow(authentication);

        // Assert
        assertFalse(result);
    }

    // Additional tests to improve branch coverage for hasConnections method
    @Test
    void hasConnections_WithElderlyUserWithStoredConnections_ShouldReturnTrue() {
        // Arrange
        testUser.setRole(User.Role.ELDERLY);
        testUser.setProfileFlowCompleted(true);
        testUser.setCaregiverIds(Arrays.asList("caregiver1"));
        when(connectionService.getConnectedCaregiversForElderly(anyString())).thenReturn(new ArrayList<>());

        // Act - We need to test this through shouldShowProfileFlow since hasConnections is private
        when(authentication.getPrincipal()).thenReturn(testUser);
        boolean result = userService.shouldShowProfileFlow(authentication);

        // Assert - should return false because user has connections
        assertFalse(result);
    }

    @Test
    void hasConnections_WithElderlyUserWithServiceConnections_ShouldReturnTrue() {
        // Arrange
        testUser.setRole(User.Role.ELDERLY);
        testUser.setProfileFlowCompleted(true);
        testUser.setCaregiverIds(new ArrayList<>());
        User mockCaregiver = new User();
        mockCaregiver.setId("caregiver1");
        when(connectionService.getConnectedCaregiversForElderly(anyString())).thenReturn(Arrays.asList(mockCaregiver));

        // Act - We need to test this through shouldShowProfileFlow since hasConnections is private
        when(authentication.getPrincipal()).thenReturn(testUser);
        boolean result = userService.shouldShowProfileFlow(authentication);

        // Assert - should return false because user has connections
        assertFalse(result);
    }

    @Test
    void hasConnections_WithCaregiverUserWithStoredConnections_ShouldReturnTrue() {
        // Arrange
        testUser.setRole(User.Role.CAREGIVER);
        testUser.setProfileFlowCompleted(true);
        testUser.setElderlyUserIds(Arrays.asList("elderly1"));
        when(connectionService.getConnectedElderlyForCaregiver(anyString())).thenReturn(new ArrayList<>());

        // Act - We need to test this through shouldShowProfileFlow since hasConnections is private
        when(authentication.getPrincipal()).thenReturn(testUser);
        boolean result = userService.shouldShowProfileFlow(authentication);

        // Assert - should return false because user has connections
        assertFalse(result);
    }

    @Test
    void hasConnections_WithCaregiverUserWithServiceConnections_ShouldReturnTrue() {
        // Arrange
        testUser.setRole(User.Role.CAREGIVER);
        testUser.setProfileFlowCompleted(true);
        testUser.setElderlyUserIds(new ArrayList<>());
        User mockElderly = new User();
        mockElderly.setId("elderly1");
        when(connectionService.getConnectedElderlyForCaregiver(anyString())).thenReturn(Arrays.asList(mockElderly));

        // Act - We need to test this through shouldShowProfileFlow since hasConnections is private
        when(authentication.getPrincipal()).thenReturn(testUser);
        boolean result = userService.shouldShowProfileFlow(authentication);

        // Assert - should return false because user has connections
        assertFalse(result);
    }

    // Additional tests for updateUserProfile to improve branch coverage
    @Test
    void updateUserProfile_WithInvalidDateOfBirth_ShouldThrowException() {
        // Arrange
        testUserDTO.setDateOfBirth("invalid-date");
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act & Assert
        UserProfileValidationException exception = assertThrows(UserProfileValidationException.class, () -> {
            userService.updateUserProfile(authentication, testUserDTO);
        });
        assertTrue(exception.getMessage().contains("Date of birth must be in YYYY-MM-DD format"));
    }

    @Test
    void updateUserProfile_WithValidData_ShouldNotThrowException() {
        // Arrange
        testUserDTO.setDateOfBirth("1990-01-01");
        testUserDTO.setPhoneNumber("+1234567890");
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act & Assert - should not throw exception for valid data
        assertDoesNotThrow(() -> {
            userService.updateUserProfile(authentication, testUserDTO);
        });
    }

    // Additional tests for updateProfileStep to improve branch coverage
    @Test
    void updateProfileStep_WithStep1_ShouldUpdateCurrentStep() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        userService.updateProfileStep(authentication, 1);

        // Assert
        assertEquals(1, testUser.getCurrentProfileStep());
        verify(userRepository).save(testUser);
    }

    @Test
    void updateProfileStep_WithStep2_ShouldUpdateStep2() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        userService.updateProfileStep(authentication, 2);

        // Assert
        assertTrue(testUser.getProfileStep2Completed());
        assertEquals(2, testUser.getCurrentProfileStep());
        verify(userRepository).save(testUser);
    }

    @Test
    void updateProfileStep_WithStep3_ShouldUpdateStep3() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        userService.updateProfileStep(authentication, 3);

        // Assert
        assertTrue(testUser.getProfileStep3Completed());
        assertEquals(3, testUser.getCurrentProfileStep());
        verify(userRepository).save(testUser);
    }

    @Test
    void updateProfileStep_WithStep2ForElderly_ShouldUpdateHighestStep() {
        // Arrange
        testUser.setRole(User.Role.ELDERLY);
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        userService.updateProfileStep(authentication, 2);

        // Assert
        assertTrue(testUser.getProfileStep2Completed());
        assertEquals(2, testUser.getHighestStepReached());
        verify(userRepository).save(testUser);
    }

    @Test
    void updateProfileStep_WithStep3ForElderly_ShouldUpdateHighestStep() {
        // Arrange
        testUser.setRole(User.Role.ELDERLY);
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        userService.updateProfileStep(authentication, 3);

        // Assert
        assertTrue(testUser.getProfileStep3Completed());
        assertEquals(3, testUser.getHighestStepReached());
        assertTrue(testUser.getProfileFlowCompleted());
        verify(userRepository).save(testUser);
    }

    @Test
    void updateProfileStep_WithStep2ForCaregiver_ShouldCompleteProfile() {
        // Arrange
        testUser.setRole(User.Role.CAREGIVER);
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        userService.updateProfileStep(authentication, 2);

        // Assert
        assertTrue(testUser.getProfileStep2Completed());
        assertTrue(testUser.getProfileFlowCompleted());
        verify(userRepository).save(testUser);
    }
}
